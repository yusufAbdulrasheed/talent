import crypto from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import environment from '../config/env.js';

vi.mock('../services/email.service.js', () => ({ sendEmail: vi.fn(async () => {}) }));

const { handler } = await import('../../netlify/functions/api.js');
const Payment = (await import('../models/payment.model.js')).default;

/**
 * A minimal but realistic AWS API-Gateway-proxy-v1 event — the shape
 * Netlify's own classic Functions runtime sends. `path` is the app-level
 * path (e.g. "/api/v1/health"); it is translated here into the
 * /.netlify/functions/api/... form Netlify's own `/api/*` redirect produces,
 * so these tests also prove the handler's own path rewrite, not just app.js.
 */
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

    // A single Set-Cookie header comes back as a plain string on this event
    // type (serverless-http only moves repeated headers into
    // multiValueHeaders) — Netlify's runtime forwards it to the browser as-is.
    expect(response.headers['set-cookie']).toMatch(/^refreshToken=/);
  });

  it('verifies a correctly signed Paystack webhook against the exact raw bytes', async () => {
    const webhookPayload = { event: 'charge.success', data: { reference: 'does-not-exist-in-db' } };
    // Deliberately irregular spacing: JSON.stringify always produces this
    // exact byte sequence, but any step that re-serialized or re-encoded the
    // body (instead of forwarding it untouched) would reflow it and break the
    // signature below.
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
    // No Payment exists for this reference, so handleChargeSuccess returns
    // early — confirming the request reached the controller rather than
    // failing signature verification for an unrelated reason.
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
