import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';
import RecruiterSubscription from '../models/recruiter-subscription.model.js';
import { bearer, createCandidate, createRecruiter } from '../test/factories.js';

describe('anonymous talent pool', () => {
  const FORBIDDEN_SUBSTRINGS = [
    '+2348012345678', 
    'Ada Obi', 
    'Acme Ltd', 
    '@example.test', 
  ];

  it('exposes only whitelisted fields for an unlocked (free-tier) candidate', async () => {
    const { token } = await createRecruiter();
    await createCandidate({ status: CANDIDATE_STATUSES.APPROVED, overrides: { experienceLevel: 'junior' } });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data.candidates).toHaveLength(1);

    const [candidate] = response.body.data.candidates;

    expect(candidate.locked).toBe(false);
    expect(Object.keys(candidate).sort()).toEqual([
      'bio',
      'certifications',
      'education',
      'jobTitle',
      'location',
      'locked',
      'referenceNumber',
      'skills',
    ]);
    expect(candidate).not.toHaveProperty('experienceLevel');
    expect(candidate).not.toHaveProperty('availability');
  });

  it('does not list a candidate above the recruiter\'s tier — it is only counted', async () => {
    const { token } = await createRecruiter();
    const { candidate } = await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { experienceLevel: 'mid' },
    });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data.candidates).toHaveLength(0);
    expect(response.body.data.pagination.total).toBe(0);
    expect(response.body.data.tiers).toEqual([
      { tier: 'junior', unlocked: true, total: 0 },
      { tier: 'intermediate', unlocked: false, total: 1 },
      { tier: 'senior', unlocked: false, total: 0 },
    ]);

    const body = JSON.stringify(response.body);
    expect(body).not.toContain(candidate.referenceNumber);
    expect(body).not.toContain('Ikeja');
    expect(body).not.toContain('React');
    expect(body).not.toContain('experienceLevel');
    expect(body).not.toContain('"mid"');
  });

  it('lists only the requested tier\'s talent', async () => {
    const { token, company } = await createRecruiter();
    await RecruiterSubscription.create({
      recruiterCompany: company.id,
      tier: 'senior',
      tierExpiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    });
    for (const experienceLevel of ['entry', 'junior', 'mid', 'senior']) {
      await createCandidate({ status: CANDIDATE_STATUSES.APPROVED, overrides: { experienceLevel } });
    }

    const countFor = async (query) => {
      const response = await request(app)
        .get(`/api/v1/recruiter/talent-pool${query}`)
        .set('Authorization', bearer(token));

      expect(response.status).toBe(200);
      return response.body.data.candidates.length;
    };

    expect(await countFor('')).toBe(4);
    expect(await countFor('?tier=junior')).toBe(2);
    expect(await countFor('?tier=intermediate')).toBe(1);
    expect(await countFor('?tier=senior')).toBe(1);
  });

  it('returns nothing for a tier above the recruiter\'s plan, however it is asked for', async () => {
    const { token } = await createRecruiter();
    await createCandidate({ status: CANDIDATE_STATUSES.APPROVED, overrides: { experienceLevel: 'senior' } });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool?tier=senior')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data.candidates).toHaveLength(0);
    expect(response.body.data.tiers.find((tier) => tier.tier === 'senior')).toEqual({
      tier: 'senior',
      unlocked: false,
      total: 1,
    });
  });

  it('keeps tier head-counts independent of the filters, so they cannot probe locked talent', async () => {
    const { token } = await createRecruiter();
    await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { experienceLevel: 'senior', skills: ['Kubernetes'], certifications: ['CKA'] },
    });

    const fetchTiers = async (query) => {
      const response = await request(app)
        .get(`/api/v1/recruiter/talent-pool${query}`)
        .set('Authorization', bearer(token));

      expect(response.status).toBe(200);
      expect(response.body.data.candidates).toHaveLength(0);
      return response.body.data.tiers;
    };

    const unfiltered = await fetchTiers('');
    expect(await fetchTiers('?skills=Kubernetes')).toEqual(unfiltered);
    expect(await fetchTiers('?keyword=CKA')).toEqual(unfiltered);
    expect(await fetchTiers('?skills=Welding')).toEqual(unfiltered);
  });

  it('rejects a tier that does not exist', async () => {
    const { token } = await createRecruiter();

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool?tier=platinum')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(422);
  });

  it('leaks no identifying data anywhere in the search response', async () => {
    const { token } = await createRecruiter();
    await createCandidate({ status: CANDIDATE_STATUSES.APPROVED, overrides: { experienceLevel: 'junior' } });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool')
      .set('Authorization', bearer(token));

    expect(response.body.data.candidates).toHaveLength(1);

    const body = JSON.stringify(response.body);

    for (const secret of FORBIDDEN_SUBSTRINGS) {
      expect(body, `leaked: ${secret}`).not.toContain(secret);
    }
  });

  it('leaks no identifying data on a single anonymous profile', async () => {
    const { token } = await createRecruiter();
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.APPROVED });

    const response = await request(app)
      .get(`/api/v1/recruiter/talent-pool/${candidate.referenceNumber}`)
      .set('Authorization', bearer(token));

    expect(response.status).toBe(200);

    const body = JSON.stringify(response.body);

    for (const secret of FORBIDDEN_SUBSTRINGS) {
      expect(body, `leaked: ${secret}`).not.toContain(secret);
    }
  });

  it.each([
    CANDIDATE_STATUSES.DRAFT,
    CANDIDATE_STATUSES.SUBMITTED,
    CANDIDATE_STATUSES.UNDER_REVIEW,
    CANDIDATE_STATUSES.REJECTED,
  ])('hides candidates whose status is %s', async (status) => {
    const { token } = await createRecruiter();
    await createCandidate({ status });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data.candidates).toHaveLength(0);
  });

  it('returns 404 for an unapproved reference, the same as for one that does not exist', async () => {
    const { token } = await createRecruiter();
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.UNDER_REVIEW });

    const unapproved = await request(app)
      .get(`/api/v1/recruiter/talent-pool/${candidate.referenceNumber}`)
      .set('Authorization', bearer(token));
    const missing = await request(app)
      .get('/api/v1/recruiter/talent-pool/TAL-2026-99999')
      .set('Authorization', bearer(token));

    expect(unapproved.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(unapproved.body.message).toBe(missing.body.message);
  });

  it('filters by skill without matching unrelated candidates', async () => {
    const { token } = await createRecruiter();
    await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { skills: ['React'], experienceLevel: 'junior' },
    });
    await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { skills: ['Welding'], experienceLevel: 'junior' },
    });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool?skills=React')
      .set('Authorization', bearer(token));

    expect(response.body.data.candidates).toHaveLength(1);
    expect(response.body.data.candidates[0].skills).toContain('React');
  });

  it('requires every requested skill, not just one of them', async () => {
    const { token } = await createRecruiter();
    await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { skills: ['React'], experienceLevel: 'junior' },
    });
    await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { skills: ['React', 'SQL'], experienceLevel: 'junior' },
    });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool?skills=React,SQL')
      .set('Authorization', bearer(token));

    expect(response.body.data.candidates).toHaveLength(1);
  });

  it('filters by job title and exposes it on an unlocked card', async () => {
    const { token } = await createRecruiter();
    await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { jobTitle: 'Frontend Developer', experienceLevel: 'junior' },
    });
    await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { jobTitle: 'Registered Nurse', experienceLevel: 'junior' },
    });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool?jobTitle=frontend')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data.candidates).toHaveLength(1);
    expect(response.body.data.candidates[0].jobTitle).toBe('Frontend Developer');
  });

  it('never exposes a locked candidate\'s job title, even when the filter would match it', async () => {
    const { token } = await createRecruiter();
    await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { jobTitle: 'Senior Software Architect', experienceLevel: 'senior' },
    });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool?jobTitle=architect')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data.candidates).toHaveLength(0);
    expect(JSON.stringify(response.body)).not.toContain('Architect');
  });

  it('treats a regex metacharacter in a filter as a literal', async () => {
    const { token } = await createRecruiter();
    await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { location: 'Ikeja, Lagos' },
    });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool?location=.*')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data.candidates).toHaveLength(0);
  });
});
