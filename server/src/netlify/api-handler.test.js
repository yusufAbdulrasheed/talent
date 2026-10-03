import crypto from 'node:crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import serverless from 'serverless-http';
import { describe, expect, it, vi } from 'vitest';
import environment from '../config/env.js';

vi.mock('../services/email.service.js', () => ({ sendEmail: vi.fn(async () => {}) }));

const { handler, resolveClientIp } = await import('../../netlify/functions/api.js');
const Payment = (await import('../models/payment.model.js')).default;

function buildEvent({ httpMethod, path, headers = {}, body = '', isBase64Encoded = false }) {
  return {
    httpMethod,
    path: `/.netlify/functions/api${path.replace(/^\/api/, '')}`,
    headers,
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body,
    isBase64Encoded,
    requestContext: { identity: {} },
  };
}

const context = {};

describe('netlify function handler', () => {
  it('rewrites the function path and reaches a plain route', async () => {
    const event = buildEvent({ httpMethod: 'GET', path: '/api/v1/health' });

    const response = await handler(event, context);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ status: 'ok', service: 'tms-api' });
  });

  it('parses a JSON body and round-trips the refresh cookie through the Lambda response', async () => {
    const payload = {
      firstName: 'Ada',
      lastName: 'Obi',
      email: 'ada.netlify@example.test',
      password: 'correct-horse-battery-staple',
      role: 'talent',
    };

    const event = buildEvent({
      httpMethod: 'POST',
      path: '/api/v1/auth/register',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await handler(event, context);

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body).data.user.email).toBe(payload.email);

    expect(response.headers['set-cookie']).toMatch(/^refreshToken=/);
  });

  it('verifies a correctly signed Paystack webhook against the exact raw bytes', async () => {
    const webhookPayload = { event: 'charge.success', data: { reference: 'does-not-exist-in-db' } };
    const rawBody = JSON.stringify(webhookPayload);
    const signature = crypto.createHmac('sha512', environment.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');

    const event = buildEvent({
      httpMethod: 'POST',
      path: '/api/v1/payments/paystack/webhook',
      headers: { 'content-type': 'application/json', 'x-paystack-signature': signature },
      body: rawBody,
    });

    const response = await handler(event, context);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true });
    await expect(Payment.findOne({ reference: 'does-not-exist-in-db' })).resolves.toBeNull();
  });

  it('rejects a webhook whose signature does not match the raw body', async () => {
    const rawBody = JSON.stringify({ event: 'charge.success', data: { reference: 'whatever' } });
    const wrongSignature = crypto.createHmac('sha512', 'not-the-real-secret').update(rawBody).digest('hex');

    const event = buildEvent({
      httpMethod: 'POST',
      path: '/api/v1/payments/paystack/webhook',
      headers: { 'content-type': 'application/json', 'x-paystack-signature': wrongSignature },
      body: rawBody,
    });

    const response = await handler(event, context);

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).success).toBe(false);
  });
});

describe('resolveClientIp', () => {
  it('prefers x-nf-client-connection-ip, Netlify\'s own reliable client-IP header', () => {
    const headers = { 'x-nf-client-connection-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' };
    expect(resolveClientIp(headers)).toBe('203.0.113.7');
  });

  it('falls back to the first entry of x-forwarded-for when Netlify\'s header is absent', () => {
    expect(resolveClientIp({ 'x-forwarded-for': '198.51.100.1, 10.0.0.5' })).toBe('198.51.100.1');
  });

  it('is case-insensitive about header names', () => {
    expect(resolveClientIp({ 'X-NF-Client-Connection-IP': '203.0.113.7' })).toBe('203.0.113.7');
  });

  it('returns undefined when neither header is present', () => {
    expect(resolveClientIp({})).toBeUndefined();
  });
});

describe('express-rate-limit against the real Netlify event shape', () => {
  // auth.routes.js skips its rate limiters entirely when NODE_ENV === 'test'
  // (so the full handler tests above never exercise this code path at all),
  // which is exactly how this bug shipped twice in production undetected.
  // This reproduces it directly: a real (non-skipped) limiter, fed the exact
  // event shape Netlify actually sends — requestContext.identity.sourceIp
  // absent, only the x-nf-client-connection-ip header present.
  function buildMiniHandler() {
    const miniApp = express();
    // Matches auth.routes.js's createLimiter() exactly: the fatal crash is
    // specific to standardHeaders: 'draft-8' (its getPartitionKey hashes the
    // key), not the initial IP validation warning, which alone is harmless.
    miniApp.use(rateLimit({ windowMs: 1000, limit: 100, standardHeaders: 'draft-8', legacyHeaders: false }));
    miniApp.get('/ping', (request, response) => response.json({ ip: request.ip }));
    return serverless(miniApp);
  }

  function buildRawNetlifyEvent(headers) {
    return {
      httpMethod: 'GET',
      path: '/ping',
      headers,
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      body: '',
      isBase64Encoded: false,
      requestContext: { identity: {} },
    };
  }

  it('crashes on the unpatched event — documents the exact failure the user hit in production', async () => {
    const miniHandler = buildMiniHandler();
    const event = buildRawNetlifyEvent({});

    const response = await miniHandler(event, {});

    expect(response.statusCode).toBe(500);
    expect(response.body).toMatch(/getPartitionKey/);
  });

  it('resolves correctly once api.js\'s fix injects sourceIp from x-nf-client-connection-ip', async () => {
    const miniHandler = buildMiniHandler();
    const event = buildRawNetlifyEvent({ 'x-nf-client-connection-ip': '203.0.113.7' });

    event.requestContext.identity.sourceIp = resolveClientIp(event.headers);

    const response = await miniHandler(event, {});

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).ip).toBe('203.0.113.7');
  });
});
