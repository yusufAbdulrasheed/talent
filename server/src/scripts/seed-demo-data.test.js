import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../app.js';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';
import { USER_ROLES } from '../constants/user-roles.js';
import Candidate from '../models/candidate.model.js';
import Payment from '../models/payment.model.js';
import PlacementRequest from '../models/placement-request.model.js';
import RecruiterCompany from '../models/recruiter-company.model.js';
import RecruiterSubscription from '../models/recruiter-subscription.model.js';
import User from '../models/user.model.js';
import { hasRequiredDocuments, isProfileComplete } from '../services/candidate.service.js';
import { getTierPriceNgn, TIER_EXPERIENCE_ACCESS } from '../services/recruiter-subscription.service.js';
import { bearer, createAuthedUser } from '../test/factories.js';
import { seedDemoData } from './seed-demo-data.js';

const LEVELS = ['entry', 'junior', 'mid', 'senior'];
const DAY_MS = 24 * 60 * 60 * 1000;

function login({ email, password }) {
  return request(app).post('/api/v1/auth/login').send({ email, password });
}

async function talentPoolFor(seeded, tier) {
  const recruiter = seeded.recruiters.find((candidate) => candidate.tier === tier);
  const session = await login({ email: recruiter.email, password: seeded.password });

  expect(session.status).toBe(200);

  const response = await request(app)
    .get('/api/v1/recruiter/talent-pool?limit=50')
    .set('Authorization', bearer(session.body.data.accessToken));

  expect(response.status).toBe(200);

  return response.body.data;
}

async function adminGet(url) {
  const { token } = await createAuthedUser({ role: USER_ROLES.ADMIN });
  const response = await request(app).get(url).set('Authorization', bearer(token));

  expect(response.status).toBe(200);

  return response.body.data;
}

describe('demo data seeder', () => {
  let seeded;

  beforeEach(async () => {
    seeded = await seedDemoData({ accountsFile: null });
  });

  it('creates 20 fully populated talents, five per experience level', async () => {
    const candidates = await Candidate.find({});

    expect(candidates).toHaveLength(20);
    expect(await User.countDocuments({ role: USER_ROLES.TALENT })).toBe(20);

    for (const level of LEVELS) {
      expect(candidates.filter((candidate) => candidate.experienceLevel === level)).toHaveLength(5);
    }

    for (const candidate of candidates) {
      expect(isProfileComplete(candidate)).toBe(true);
      expect(hasRequiredDocuments(candidate)).toBe(true);
      expect(candidate.availability).toBeTruthy();
      expect(candidate.certifications.length).toBeGreaterThan(0);
      expect(candidate.referenceNumber).toMatch(/^TAL-\d{4}-\d{5}$/);
    }

    expect(new Set(candidates.map((candidate) => candidate.referenceNumber)).size).toBe(20);
  });

  it('approves 16 talents (four per level) and leaves four awaiting admin review', async () => {
    const candidates = await Candidate.find({});
    const withStatus = (status) => candidates.filter((candidate) => candidate.status === status);

    expect(withStatus(CANDIDATE_STATUSES.APPROVED)).toHaveLength(16);
    expect(withStatus(CANDIDATE_STATUSES.SUBMITTED)).toHaveLength(3);
    expect(withStatus(CANDIDATE_STATUSES.UNDER_REVIEW)).toHaveLength(1);

    for (const level of LEVELS) {
      const approvedAtLevel = withStatus(CANDIDATE_STATUSES.APPROVED).filter((candidate) => candidate.experienceLevel === level);
      expect(approvedAtLevel).toHaveLength(4);
    }

    for (const candidate of withStatus(CANDIDATE_STATUSES.APPROVED)) {
      expect(candidate.adminReview.note).toContain('categorised as');
    }
    for (const candidate of withStatus(CANDIDATE_STATUSES.SUBMITTED)) {
      expect(candidate.adminReview?.reviewedAt).toBeUndefined();
    }
  });

  it('creates 15 recruiter companies spread across the subscription tiers', async () => {
    expect(await User.countDocuments({ role: USER_ROLES.RECRUITER })).toBe(15);
    expect(await RecruiterCompany.countDocuments({})).toBe(15);
    expect(await RecruiterCompany.countDocuments({ isApproved: false })).toBe(3);

    const subscriptions = await RecruiterSubscription.find({});
    const countFor = (tier) => subscriptions.filter((subscription) => subscription.tier === tier).length;

    expect(countFor('junior')).toBe(6);
    expect(countFor('intermediate')).toBe(5);
    expect(countFor('senior')).toBe(4);

    for (const subscription of subscriptions) {
      if (subscription.tier === 'junior') {
        expect(subscription.tierExpiresAt).toBeNull();
      } else {
        expect(subscription.tierExpiresAt.getTime()).toBeGreaterThan(Date.now());
      }
    }
  });

  it('records a successful subscription payment for every paid recruiter, matching their plan window', async () => {
    const payments = await Payment.find({});

    expect(payments).toHaveLength(9);

    for (const payment of payments) {
      const subscription = await RecruiterSubscription.findOne({ recruiterCompany: payment.recruiterCompany });

      expect(payment.purpose).toBe('recruiter_subscription');
      expect(payment.status).toBe('success');
      expect(payment.subscriptionTier).toBe(subscription.tier);
      expect(payment.amount).toBe(getTierPriceNgn(payment.subscriptionTier) * 100);
      expect(Math.abs(subscription.tierExpiresAt.getTime() - (payment.paidAt.getTime() + 30 * DAY_MS))).toBeLessThan(1_000);
    }
  });

  it('seeds 16 placement requests covering every status', async () => {
    const requests = await PlacementRequest.find({});
    const countFor = (status) => requests.filter((placementRequest) => placementRequest.status === status).length;

    expect(requests).toHaveLength(16);
    expect(countFor('submitted')).toBe(5);
    expect(countFor('under_review')).toBe(3);
    expect(countFor('in_progress')).toBe(4);
    expect(countFor('fulfilled')).toBe(2);
    expect(countFor('closed')).toBe(2);

    expect(requests.some((placementRequest) => placementRequest.createdAt.getTime() < Date.now() - 30 * DAY_MS)).toBe(true);
  });

  it('only seeds requests the product itself would allow', async () => {
    const requests = await PlacementRequest.find({}).populate('candidate');

    for (const placementRequest of requests) {
      const subscription = await RecruiterSubscription.findOne({ recruiterCompany: placementRequest.recruiterCompany });

      expect(placementRequest.candidate.status).toBe(CANDIDATE_STATUSES.APPROVED);
      expect(TIER_EXPERIENCE_ACCESS[subscription.tier]).toContain(placementRequest.candidate.experienceLevel);
    }
  });

  it('gives every account a working login with the shared demo password', async () => {
    const sampleTalents = LEVELS.map((level) => seeded.talents.find((talent) => talent.experienceLevel === level));
    const sampleRecruiters = ['junior', 'intermediate', 'senior'].map((tier) =>
      seeded.recruiters.find((recruiter) => recruiter.tier === tier),
    );

    for (const account of [...sampleTalents, ...sampleRecruiters, ...seeded.trainers]) {
      const response = await login({ email: account.email, password: seeded.password });

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe(account.email);
    }

    const trainerSession = await login({ email: seeded.trainers[0].email, password: seeded.password });
    expect(trainerSession.body.data.user.role).toBe('trainer');

    expect((await login({ email: sampleTalents[0].email, password: 'not-the-password' })).status).toBe(401);
  });

  it('lists exactly the talent each recruiter plan unlocks and counts the rest by tier', async () => {
    const tierTotals = { junior: 8, intermediate: 4, senior: 4 };
    const expectedListed = { junior: 8, intermediate: 12, senior: 16 };
    const unlockedTiers = {
      junior: ['junior'],
      intermediate: ['junior', 'intermediate'],
      senior: ['junior', 'intermediate', 'senior'],
    };

    for (const [plan, listed] of Object.entries(expectedListed)) {
      const { candidates, pagination, tiers } = await talentPoolFor(seeded, plan);

      expect(candidates).toHaveLength(listed);
      expect(pagination.total).toBe(listed);
      expect(candidates.every((candidate) => candidate.locked === false)).toBe(true);
      expect(tiers).toEqual(
        Object.entries(tierTotals).map(([tier, total]) => ({
          tier,
          total,
          unlocked: unlockedTiers[plan].includes(tier),
        })),
      );
    }
  });

  describe('on the admin dashboard', () => {
    it('reports every seeded candidate, recruiter, payment and placement request', async () => {
      const data = await adminGet('/api/v1/admin/dashboard');
      const seededRevenue = seeded.payments.reduce((sum, payment) => sum + getTierPriceNgn(payment.tier) * 100, 0);

      expect(data.candidates).toMatchObject({ total: 20, submitted: 20, approved: 16, awaitingReview: 4 });
      expect(data.recruiters).toEqual({ total: 15, approved: 12 });
      expect(data.placementRequests).toMatchObject({ total: 16, open: 12 });
      expect(data.placementRequests.byStatus).toMatchObject({ fulfilled: 2, closed: 2 });
      expect(data.payments).toEqual({ successfulCount: 9, totalAmount: seededRevenue });
      expect(data.trainers).toEqual({ active: 1 });
    });

    it('lists every talent with their name, email and status', async () => {
      const { candidates, pagination } = await adminGet('/api/v1/admin/candidates?limit=100');

      expect(pagination.total).toBe(20);
      expect(candidates.every((candidate) => candidate.fullName && candidate.email && candidate.status)).toBe(true);
      expect(candidates.map((candidate) => candidate.email).sort()).toEqual(seeded.talents.map((talent) => talent.email).sort());

      const awaiting = await adminGet('/api/v1/admin/candidates?status=submitted&limit=100');
      expect(awaiting.pagination.total).toBe(3);
    });

    it('lists every recruiter company with its contact and approval state', async () => {
      const { recruiters, pagination } = await adminGet('/api/v1/admin/recruiters?limit=100');

      expect(pagination.total).toBe(15);
      expect(recruiters.every((recruiter) => recruiter.companyName && recruiter.accountEmail && recruiter.cacNumber)).toBe(true);

      const pending = await adminGet('/api/v1/admin/recruiters?isApproved=false&limit=100');
      expect(pending.pagination.total).toBe(3);
    });

    it('lists the placement requests with their company and candidate reference', async () => {
      const { placementRequests, pagination } = await adminGet('/api/v1/admin/placement-requests?limit=100');

      expect(pagination.total).toBe(16);
      expect(
        placementRequests.every((placementRequest) => placementRequest.company?.companyName && placementRequest.candidate?.referenceNumber),
      ).toBe(true);
    });

    it('lists the subscription payments against their companies', async () => {
      const { payments, pagination } = await adminGet('/api/v1/admin/payments?limit=100');

      expect(pagination.total).toBe(9);
      expect(payments.every((payment) => payment.status === 'success' && payment.recruiterCompanyName)).toBe(true);
    });

    it('lists the trainer, active and ready to be assigned a programme', async () => {
      const { trainers, pagination } = await adminGet('/api/v1/admin/trainers?limit=100');

      expect(pagination.total).toBe(1);
      expect(trainers[0]).toMatchObject({
        email: seeded.trainers[0].email,
        isActive: true,
        isEmailVerified: true,
        assignmentCount: 0,
      });
    });
  });

  it('is safe to run again: existing accounts are left alone and nothing is duplicated', async () => {
    const rerun = await seedDemoData({ accountsFile: null });

    for (const group of [rerun.talents, rerun.recruiters, rerun.payments, rerun.placementRequests, rerun.trainers]) {
      expect(group.every((item) => item.created === false)).toBe(true);
    }

    expect(rerun.talents.map((talent) => talent.referenceNumber)).toEqual(
      seeded.talents.map((talent) => talent.referenceNumber),
    );
    expect(await User.countDocuments({})).toBe(36);
    expect(await User.countDocuments({ role: 'trainer' })).toBe(1);
    expect(await Candidate.countDocuments({})).toBe(20);
    expect(await RecruiterCompany.countDocuments({})).toBe(15);
    expect(await RecruiterSubscription.countDocuments({})).toBe(15);
    expect(await Payment.countDocuments({})).toBe(9);
    expect(await PlacementRequest.countDocuments({})).toBe(16);
  });

  it('fills in payments and requests missing from accounts that already exist', async () => {
    await Payment.deleteMany({});
    await PlacementRequest.deleteMany({});

    const rerun = await seedDemoData({ accountsFile: null });

    expect(rerun.talents.every((talent) => talent.created === false)).toBe(true);
    expect(rerun.recruiters.every((recruiter) => recruiter.created === false)).toBe(true);
    expect(rerun.trainers.every((trainer) => trainer.created === false)).toBe(true);
    expect(await User.countDocuments({})).toBe(36);
    expect(await Payment.countDocuments({})).toBe(9);
    expect(await PlacementRequest.countDocuments({})).toBe(16);
  });

  it('backfills jobTitle onto talents that were seeded before that field existed', async () => {
    await Candidate.updateMany({}, { $unset: { jobTitle: '' } });
    expect(await Candidate.countDocuments({ jobTitle: { $exists: true } })).toBe(0);

    const rerun = await seedDemoData({ accountsFile: null });

    expect(rerun.talents.every((talent) => talent.created === false)).toBe(true);
    expect(rerun.talents.every((talent) => talent.jobTitle)).toBe(true);

    const candidates = await Candidate.find({});
    expect(candidates.every((candidate) => candidate.jobTitle)).toBe(true);
    expect(candidates).toHaveLength(20);
    expect(candidates.map((candidate) => candidate.referenceNumber).sort()).toEqual(
      seeded.talents.map((talent) => talent.referenceNumber).sort(),
    );
  });

  it('re-activates a paid recruiter\'s subscription if real time has pushed it past its 30-day window', async () => {
    const senior = seeded.recruiters.find((recruiter) => recruiter.tier === 'senior');
    await RecruiterSubscription.updateOne(
      { recruiterCompany: senior.companyId },
      { tier: 'junior', tierExpiresAt: null },
    );
    expect((await RecruiterSubscription.findOne({ recruiterCompany: senior.companyId })).tier).toBe('junior');

    const rerun = await seedDemoData({ accountsFile: null });

    expect(rerun.recruiters.every((recruiter) => recruiter.created === false)).toBe(true);
    const restored = await RecruiterSubscription.findOne({ recruiterCompany: senior.companyId });
    expect(restored.tier).toBe('senior');
    expect(restored.tierExpiresAt.getTime()).toBeGreaterThan(Date.now());

    expect(await PlacementRequest.countDocuments({})).toBe(16);
  });

  it('leaves a junior-tier recruiter\'s subscription alone — nothing to refresh on the free tier', async () => {
    const junior = seeded.recruiters.find((recruiter) => recruiter.tier === 'junior');
    const before = await RecruiterSubscription.findOne({ recruiterCompany: junior.companyId });

    await seedDemoData({ accountsFile: null });

    const after = await RecruiterSubscription.findOne({ recruiterCompany: junior.companyId });
    expect(after.tier).toBe('junior');
    expect(after.tierExpiresAt).toBeNull();
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime());
  });

  it('never overwrites a jobTitle someone actually set by hand', async () => {
    const candidate = await Candidate.findOne({});
    candidate.jobTitle = 'Edited By A Real Person';
    await candidate.save();

    await seedDemoData({ accountsFile: null });

    const reloaded = await Candidate.findById(candidate.id);
    expect(reloaded.jobTitle).toBe('Edited By A Real Person');
  });

  it('writes a credentials sheet listing every demo account, the password and the seeded requests', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'tms-demo-accounts-'));
    const accountsFile = path.join(directory, 'demo-accounts.md');

    try {
      await seedDemoData({ accountsFile });
      const sheet = await readFile(accountsFile, 'utf8');

      expect(sheet).toContain(seeded.password);

      for (const account of [...seeded.talents, ...seeded.recruiters, ...seeded.trainers]) {
        expect(sheet).toContain(account.email);
      }

      expect(sheet).toContain('| Name | Job title | Email | Reference | Status | Location | Availability |');

      for (const talent of seeded.talents) {
        expect(sheet).toContain(talent.referenceNumber);
        expect(sheet).toContain(talent.jobTitle);
      }

      for (const placementRequest of seeded.placementRequests) {
        expect(sheet).toContain(placementRequest.jobTitle);
      }

      for (const heading of [
        'Entry level',
        'Junior level',
        'Mid level',
        'Senior level',
        'Placement requests (16)',
        'Trainers (1)',
      ]) {
        expect(sheet).toContain(heading);
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('rejects a password the login form would refuse', async () => {
    await expect(seedDemoData({ password: 'short', accountsFile: null })).rejects.toThrow(/at least 8 characters/);
  });
});
