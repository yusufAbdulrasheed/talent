import crypto from 'node:crypto';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../app.js';
import Payment from '../models/payment.model.js';
import Candidate from '../models/candidate.model.js';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';
import { createCandidate } from '../test/factories.js';

const SECRET = 'sk_test_dummy_secret';
const WEBHOOK_PATH = '/api/v1/payments/paystack/webhook';

function sign(body) {
  return crypto.createHmac('sha512', SECRET).update(body).digest('hex');
}

/** Stubs Paystack's verify endpoint, which the webhook calls before trusting anything. */
function stubVerify({ status = 'success', amount, currency = 'NGN' }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        status: true,
        data: { status, amount, currency, paid_at: new Date().toISOString() },
      }),
    })),
  );
}

async function seedPayment(amountNaira = 5000) {
  const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.PAYMENT_PENDING });
  const payment = await Payment.create({
    candidate: candidate.id,
    reference: 'TMS-TEST-0001',
    amount: amountNaira,
    status: 'initialized',
  });

  return { candidate, payment };
}

function post(body, signature) {
  const raw = JSON.stringify(body);

  return request(app)
    .post(WEBHOOK_PATH)
    .set('Content-Type', 'application/json')
    .set('x-paystack-signature', signature ?? sign(raw))
    .send(raw);
}

const chargeSuccess = { event: 'charge.success', data: { reference: 'TMS-TEST-0001' } };

describe('Paystack webhook', () => {
  beforeEach(async () => {
    await seedPayment();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects a request with no signature', async () => {
    const response = await request(app)
      .post(WEBHOOK_PATH)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(chargeSuccess));

    expect(response.status).toBe(401);
    expect((await Payment.findOne()).status).toBe('initialized');
  });

  it('rejects a forged signature', async () => {
    const response = await post(chargeSuccess, 'f'.repeat(128));

    expect(response.status).toBe(401);
    expect((await Payment.findOne()).status).toBe('initialized');
  });

  it('rejects a body that was tampered with after signing', async () => {
    const signature = sign(JSON.stringify(chargeSuccess));
    const tampered = JSON.stringify({ ...chargeSuccess, data: { reference: 'TMS-OTHER' } });

    const response = await request(app)
      .post(WEBHOOK_PATH)
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', signature)
      .send(tampered);

    expect(response.status).toBe(401);
  });

  it('confirms the payment and advances the candidate on a verified charge', async () => {
    stubVerify({ amount: 500_000 }); // 5000 naira in kobo

    const response = await post(chargeSuccess);
    expect(response.status).toBe(200);

    const payment = await Payment.findOne();
    expect(payment.status).toBe('success');
    expect(payment.paidAt).toBeInstanceOf(Date);

    const candidate = await Candidate.findById(payment.candidate);
    expect(candidate.status).toBe(CANDIDATE_STATUSES.PAYMENT_CONFIRMED);
  });

  it('refuses a charge whose verified amount is lower than the invoice', async () => {
    // The signature is valid, but Paystack reports 100 naira against a 5000
    // naira invoice. Trusting the event alone would grant training for ₦100.
    stubVerify({ amount: 10_000 });

    const response = await post(chargeSuccess);

    expect(response.status).toBe(400);
    expect((await Payment.findOne()).status).toBe('initialized');
    expect((await Candidate.findOne()).status).toBe(CANDIDATE_STATUSES.PAYMENT_PENDING);
  });

  it('refuses a charge in a different currency', async () => {
    stubVerify({ amount: 500_000, currency: 'USD' });

    const response = await post(chargeSuccess);

    expect(response.status).toBe(400);
    expect((await Payment.findOne()).status).toBe('initialized');
  });

  it('refuses a charge that Paystack does not report as successful', async () => {
    stubVerify({ status: 'failed', amount: 500_000 });

    const response = await post(chargeSuccess);

    expect(response.status).toBe(400);
    expect((await Payment.findOne()).status).toBe('initialized');
  });

  it('is idempotent when Paystack retries the same event', async () => {
    stubVerify({ amount: 500_000 });

    await post(chargeSuccess).expect(200);
    const firstPaidAt = (await Payment.findOne()).paidAt;

    await post(chargeSuccess).expect(200);
    const payment = await Payment.findOne();

    expect(payment.status).toBe('success');
    expect(payment.paidAt.getTime()).toBe(firstPaidAt.getTime());
    expect(await Payment.countDocuments()).toBe(1);
  });

  it('acknowledges an unrelated event without touching the payment', async () => {
    const response = await post({ event: 'transfer.success', data: { reference: 'TMS-TEST-0001' } });

    expect(response.status).toBe(200);
    expect((await Payment.findOne()).status).toBe('initialized');
  });

  it('acknowledges an unknown reference rather than erroring', async () => {
    const response = await post({ event: 'charge.success', data: { reference: 'NOT-OURS' } });

    // Acknowledged so Paystack stops retrying an event that is not ours.
    expect(response.status).toBe(200);
  });
});
