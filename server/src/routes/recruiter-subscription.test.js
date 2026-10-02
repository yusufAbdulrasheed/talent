import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/email.service.js', () => ({ sendEmail: vi.fn(async () => {}) }));
vi.mock('../services/paystack.service.js', () => ({
  initializePaystackTransaction: vi.fn(async ({ reference }) => ({
    authorization_url: `https://paystack.test/pay/${reference}`,
    access_code: 'test-access-code',
    reference,
  })),
  verifyPaystackTransaction: vi.fn(async (reference) => ({
    status: 'success',
    reference,
    paid_at: new Date().toISOString(),
  })),
  verifyPaystackSignature: vi.fn(() => true),
}));

const app = (await import('../app.js')).default;
const { default: RecruiterSubscription } = await import('../models/recruiter-subscription.model.js');
const { CANDIDATE_STATUSES } = await import('../constants/statuses.js');
const { bearer, createCandidate, createRecruiter } = await import('../test/factories.js');

const DAY_MS = 24 * 60 * 60 * 1000;

function postWebhook(reference) {
  return request(app)
    .post('/api/v1/payments/paystack/webhook')
    .set('Content-Type', 'application/json')
    .set('x-paystack-signature', 'irrelevant-because-mocked')
    .send({ event: 'charge.success', data: { reference } });
}

function submitRequest(token, referenceNumber) {
  return request(app)
    .post('/api/v1/recruiter/placement-requests')
    .set('Authorization', bearer(token))
    .send({
      candidateReference: referenceNumber,
      jobTitle: 'Backend Developer',
      jobDescription: 'We need a backend developer for our team.',
      employmentType: 'full_time',
      location: 'Lagos',
    });
}

describe('recruiter subscription — tiers and gating', () => {
  it('defaults a new recruiter to the free junior tier', async () => {
    const { token } = await createRecruiter();

    const response = await request(app)
      .get('/api/v1/recruiter/subscription')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data.subscription.tier).toBe('junior');
    expect(response.body.data.subscription.pricing).toEqual({ intermediate: 15000, senior: 30000 });
  });

  it('lists only candidates within the recruiter\'s tier, counts the rest, and never exposes the literal experience level', async () => {
    const { token } = await createRecruiter();
    await createCandidate({ status: CANDIDATE_STATUSES.APPROVED, overrides: { experienceLevel: 'junior' } });
    await createCandidate({ status: CANDIDATE_STATUSES.APPROVED, overrides: { experienceLevel: 'mid' } });
    await createCandidate({ status: CANDIDATE_STATUSES.APPROVED, overrides: { experienceLevel: 'senior' } });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    // Only the junior-level candidate is listed; the other two are locked and appear only as counts.
    expect(response.body.data.candidates).toHaveLength(1);
    expect(response.body.data.candidates[0].locked).toBe(false);
    expect(response.body.data.tiers).toEqual([
      { tier: 'junior', unlocked: true, total: 1 },
      { tier: 'intermediate', unlocked: false, total: 1 },
      { tier: 'senior', unlocked: false, total: 1 },
    ]);

    const body = JSON.stringify(response.body);
    expect(body).not.toContain('experienceLevel');
    // Tier names are plan names and are shown on purpose; the underlying levels are not.
    expect(body).not.toContain('"mid"');
    expect(body).not.toContain('"entry"');
  });

  it('blocks a placement request for a candidate outside the recruiter\'s tier, even with a known reference', async () => {
    const { token } = await createRecruiter();
    const { candidate } = await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { experienceLevel: 'mid' },
    });

    const response = await submitRequest(token, candidate.referenceNumber);

    expect(response.status).toBe(403);
  });

  it('unlocks a candidate and allows a placement request after a successful subscription payment', async () => {
    const { token } = await createRecruiter();
    const { candidate } = await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { experienceLevel: 'mid' },
    });

    const checkout = await request(app)
      .post('/api/v1/recruiter/subscription/checkout')
      .set('Authorization', bearer(token))
      .send({ tier: 'intermediate' });
    expect(checkout.status).toBe(201);

    await postWebhook(checkout.body.data.reference).expect(200);

    const subscription = await request(app)
      .get('/api/v1/recruiter/subscription')
      .set('Authorization', bearer(token));
    expect(subscription.body.data.subscription.tier).toBe('intermediate');

    const pool = await request(app)
      .get('/api/v1/recruiter/talent-pool')
      .set('Authorization', bearer(token));
    expect(pool.body.data.candidates[0].locked).toBe(false);

    const placement = await submitRequest(token, candidate.referenceNumber);
    expect(placement.status).toBe(201);
  });

  it('rejects buying a lower tier than the one already active', async () => {
    const { token, company } = await createRecruiter();
    await RecruiterSubscription.create({
      recruiterCompany: company.id,
      tier: 'senior',
      tierExpiresAt: new Date(Date.now() + 20 * DAY_MS),
    });

    const response = await request(app)
      .post('/api/v1/recruiter/subscription/checkout')
      .set('Authorization', bearer(token))
      .send({ tier: 'intermediate' });

    expect(response.status).toBe(409);
  });

  it('extends the expiry on a same-tier renewal from the current expiry, not from now', async () => {
    const { token, company } = await createRecruiter();
    const originalExpiry = new Date(Date.now() + 10 * DAY_MS);
    await RecruiterSubscription.create({ recruiterCompany: company.id, tier: 'intermediate', tierExpiresAt: originalExpiry });

    const checkout = await request(app)
      .post('/api/v1/recruiter/subscription/checkout')
      .set('Authorization', bearer(token))
      .send({ tier: 'intermediate' });
    expect(checkout.status).toBe(201);

    await postWebhook(checkout.body.data.reference).expect(200);

    const updated = await RecruiterSubscription.findOne({ recruiterCompany: company.id });
    expect(updated.tierExpiresAt.getTime()).toBe(originalExpiry.getTime() + 30 * DAY_MS);
  });

  it('reverts a recruiter to the junior tier once their paid tier has expired', async () => {
    const { token, company } = await createRecruiter();
    await RecruiterSubscription.create({
      recruiterCompany: company.id,
      tier: 'senior',
      tierExpiresAt: new Date(Date.now() - 1000),
    });
    await createCandidate({ status: CANDIDATE_STATUSES.APPROVED, overrides: { experienceLevel: 'senior' } });

    const pool = await request(app)
      .get('/api/v1/recruiter/talent-pool')
      .set('Authorization', bearer(token));
    // The lapsed senior plan no longer unlocks senior talent: it is not listed, only counted.
    expect(pool.body.data.candidates).toHaveLength(0);
    expect(pool.body.data.tiers.find((tier) => tier.tier === 'senior')).toEqual({
      tier: 'senior',
      unlocked: false,
      total: 1,
    });

    const subscription = await request(app)
      .get('/api/v1/recruiter/subscription')
      .set('Authorization', bearer(token));
    expect(subscription.body.data.subscription.tier).toBe('junior');
  });
});
