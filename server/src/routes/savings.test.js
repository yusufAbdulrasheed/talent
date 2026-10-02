import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/email.service.js', () => ({ sendEmail: vi.fn(async () => {}) }));

const app = (await import('../app.js')).default;
const { default: TalentSavings } = await import('../models/talent-savings.model.js');
const { currentPeriod, addMonthsToPeriod } = await import('../services/talent-savings.service.js');
const { USER_ROLES } = await import('../constants/user-roles.js');
const { CANDIDATE_STATUSES } = await import('../constants/statuses.js');
const { bearer, createAuthedUser, createCandidate, createTalentSavings } = await import('../test/factories.js');

async function admin() {
  const { token } = await createAuthedUser({ role: USER_ROLES.ADMIN });
  return token;
}

async function talentWithCandidate() {
  const { user, token } = await createAuthedUser({ role: USER_ROLES.TALENT });
  const { candidate } = await createCandidate({ user, status: CANDIDATE_STATUSES.APPROVED });
  return { user, token, candidate };
}

describe('talent savings — lazy accrual', () => {
  it('posts one ledger entry per elapsed month on read', async () => {
    const { token, candidate } = await talentWithCandidate();
    await createTalentSavings({ candidate, lastAccrualPeriod: addMonthsToPeriod(currentPeriod(), -3) });

    const response = await request(app)
      .get('/api/v1/talent/savings')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data.savings.accrualCount).toBe(3);
    expect(response.body.data.savings.ledger).toHaveLength(3);
    expect(response.body.data.savings.balance).toBeCloseTo(200000 * 0.1 * 3, 2);
  });

  it('does not double-accrue on a second read in the same period', async () => {
    const { token, candidate } = await talentWithCandidate();
    await createTalentSavings({ candidate, lastAccrualPeriod: addMonthsToPeriod(currentPeriod(), -1) });

    await request(app).get('/api/v1/talent/savings').set('Authorization', bearer(token));
    const second = await request(app).get('/api/v1/talent/savings').set('Authorization', bearer(token));

    expect(second.body.data.savings.accrualCount).toBe(1);
  });

  it('freezes accrual while discontinued', async () => {
    const { token, candidate } = await talentWithCandidate();
    await createTalentSavings({ candidate, lastAccrualPeriod: addMonthsToPeriod(currentPeriod(), -1) });
    await request(app).get('/api/v1/talent/savings').set('Authorization', bearer(token));

    await request(app)
      .patch('/api/v1/talent/savings/participation')
      .set('Authorization', bearer(token))
      .send({ status: 'discontinued' })
      .expect(200);

    // Simulate months passing while discontinued.
    const savings = await TalentSavings.findOne({ candidate: candidate.id });
    savings.lastAccrualPeriod = addMonthsToPeriod(currentPeriod(), -5);
    await savings.save();

    const response = await request(app)
      .get('/api/v1/talent/savings')
      .set('Authorization', bearer(token));

    expect(response.body.data.savings.status).toBe('discontinued');
    expect(response.body.data.savings.accrualCount).toBe(1);
  });

  it('does not retroactively accrue the paused gap on resume', async () => {
    const { token, candidate } = await talentWithCandidate();
    await createTalentSavings({ candidate, lastAccrualPeriod: addMonthsToPeriod(currentPeriod(), -1) });
    await request(app).get('/api/v1/talent/savings').set('Authorization', bearer(token));

    await request(app)
      .patch('/api/v1/talent/savings/participation')
      .set('Authorization', bearer(token))
      .send({ status: 'discontinued' })
      .expect(200);

    const savings = await TalentSavings.findOne({ candidate: candidate.id });
    savings.lastAccrualPeriod = addMonthsToPeriod(currentPeriod(), -6);
    await savings.save();

    const resume = await request(app)
      .patch('/api/v1/talent/savings/participation')
      .set('Authorization', bearer(token))
      .send({ status: 'active' })
      .expect(200);

    // Resuming itself must not post the paused-gap backlog.
    expect(resume.body.data.savings.accrualCount).toBe(1);

    const after = await request(app)
      .get('/api/v1/talent/savings')
      .set('Authorization', bearer(token));

    // Only the current month accrues going forward.
    expect(after.body.data.savings.accrualCount).toBe(2);
  });
});

describe('talent savings — withdrawals', () => {
  it('blocks a withdrawal request before six months of savings have accrued', async () => {
    const { token, candidate } = await talentWithCandidate();
    await createTalentSavings({ candidate, lastAccrualPeriod: addMonthsToPeriod(currentPeriod(), -3) });
    await request(app).get('/api/v1/talent/savings').set('Authorization', bearer(token));

    const response = await request(app)
      .post('/api/v1/talent/savings/withdrawals')
      .set('Authorization', bearer(token))
      .send({ amount: 1000 });

    expect(response.status).toBe(409);
  });

  it('blocks a withdrawal request above 90% of the balance', async () => {
    const { token, candidate } = await talentWithCandidate();
    await createTalentSavings({ candidate, lastAccrualPeriod: addMonthsToPeriod(currentPeriod(), -6) });
    const savingsRes = await request(app).get('/api/v1/talent/savings').set('Authorization', bearer(token));

    const response = await request(app)
      .post('/api/v1/talent/savings/withdrawals')
      .set('Authorization', bearer(token))
      .send({ amount: savingsRes.body.data.savings.balance }); // 100%, over the 90% cap

    expect(response.status).toBe(422);
  });

  it('allows only one pending withdrawal request at a time', async () => {
    const { token, candidate } = await talentWithCandidate();
    await createTalentSavings({ candidate, lastAccrualPeriod: addMonthsToPeriod(currentPeriod(), -6) });
    await request(app).get('/api/v1/talent/savings').set('Authorization', bearer(token));

    await request(app)
      .post('/api/v1/talent/savings/withdrawals')
      .set('Authorization', bearer(token))
      .send({ amount: 1000 })
      .expect(201);

    const second = await request(app)
      .post('/api/v1/talent/savings/withdrawals')
      .set('Authorization', bearer(token))
      .send({ amount: 1000 });

    expect(second.status).toBe(409);
  });

  it('lets an administrator approve a withdrawal, deducting the balance', async () => {
    const adminToken = await admin();
    const { token, candidate } = await talentWithCandidate();
    await createTalentSavings({ candidate, lastAccrualPeriod: addMonthsToPeriod(currentPeriod(), -6) });
    const before = await request(app).get('/api/v1/talent/savings').set('Authorization', bearer(token));
    const balanceBefore = before.body.data.savings.balance;

    const withdrawal = await request(app)
      .post('/api/v1/talent/savings/withdrawals')
      .set('Authorization', bearer(token))
      .send({ amount: 1000 })
      .expect(201);
    const requestId = withdrawal.body.data.savings.withdrawalRequests[0].id;

    const decision = await request(app)
      .patch(`/api/v1/admin/savings/withdrawals/${candidate.id}/${requestId}`)
      .set('Authorization', bearer(adminToken))
      .send({ status: 'approved' });

    expect(decision.status).toBe(200);
    expect(decision.body.data.savings.balance).toBeCloseTo(balanceBefore - 1000, 2);
    expect(decision.body.data.savings.withdrawalRequests[0].status).toBe('approved');
  });

  it('requires a note when an administrator rejects a withdrawal', async () => {
    const adminToken = await admin();
    const { token, candidate } = await talentWithCandidate();
    await createTalentSavings({ candidate, lastAccrualPeriod: addMonthsToPeriod(currentPeriod(), -6) });
    await request(app).get('/api/v1/talent/savings').set('Authorization', bearer(token));

    const withdrawal = await request(app)
      .post('/api/v1/talent/savings/withdrawals')
      .set('Authorization', bearer(token))
      .send({ amount: 1000 })
      .expect(201);
    const requestId = withdrawal.body.data.savings.withdrawalRequests[0].id;

    const response = await request(app)
      .patch(`/api/v1/admin/savings/withdrawals/${candidate.id}/${requestId}`)
      .set('Authorization', bearer(adminToken))
      .send({ status: 'rejected' });

    expect(response.status).toBe(422);
  });

  it('lists pending withdrawal requests across candidates for an administrator', async () => {
    const adminToken = await admin();
    const { token, candidate } = await talentWithCandidate();
    await createTalentSavings({ candidate, lastAccrualPeriod: addMonthsToPeriod(currentPeriod(), -6) });
    await request(app).get('/api/v1/talent/savings').set('Authorization', bearer(token));
    await request(app)
      .post('/api/v1/talent/savings/withdrawals')
      .set('Authorization', bearer(token))
      .send({ amount: 1000 })
      .expect(201);

    const response = await request(app)
      .get('/api/v1/admin/savings/withdrawals')
      .set('Authorization', bearer(adminToken));

    expect(response.status).toBe(200);
    expect(response.body.data.withdrawalRequests).toHaveLength(1);
    expect(response.body.data.withdrawalRequests[0].referenceNumber).toBe(candidate.referenceNumber);
  });
});

describe('admin candidate attributes', () => {
  it('lets an administrator set availability and experience level', async () => {
    const adminToken = await admin();
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.APPROVED });

    const response = await request(app)
      .patch(`/api/v1/admin/candidates/${candidate.id}/attributes`)
      .set('Authorization', bearer(adminToken))
      .send({ availability: 'immediate', experienceLevel: 'senior' });

    expect(response.status).toBe(200);
    expect(response.body.data.candidate.availability).toBe('immediate');
    expect(response.body.data.candidate.experienceLevel).toBe('senior');
  });

  it('refuses a non-administrator', async () => {
    const { token } = await createAuthedUser({ role: USER_ROLES.RECRUITER });
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.APPROVED });

    const response = await request(app)
      .patch(`/api/v1/admin/candidates/${candidate.id}/attributes`)
      .set('Authorization', bearer(token))
      .send({ availability: 'immediate' });

    expect(response.status).toBe(403);
  });

  it('still refuses a talent trying to set these fields on their own profile', async () => {
    const { token } = await talentWithCandidate();

    const response = await request(app)
      .patch('/api/v1/talent/profile')
      .set('Authorization', bearer(token))
      .send({ availability: 'immediate', experienceLevel: 'senior' });

    expect(response.status).toBe(422);
  });
});
