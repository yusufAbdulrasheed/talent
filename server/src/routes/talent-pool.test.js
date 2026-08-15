import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';
import { bearer, createCandidate, createRecruiter } from '../test/factories.js';

/**
 * The product promise is that a recruiter cannot learn who a candidate is.
 * These tests assert that over real HTTP, on the serialised response body,
 * rather than on the serializer in isolation.
 */
describe('anonymous talent pool', () => {
  const FORBIDDEN_SUBSTRINGS = [
    '+2348012345678', // phone number
    'Ada Obi', // name typed into the work-experience free text
    'Acme Ltd', // employer named in the same free text
    '@example.test', // the candidate's account email
  ];

  it('exposes only whitelisted fields for an approved candidate', async () => {
    const { token } = await createRecruiter();
    await createCandidate({ status: CANDIDATE_STATUSES.APPROVED });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data.candidates).toHaveLength(1);

    const [candidate] = response.body.data.candidates;

    expect(Object.keys(candidate).sort()).toEqual([
      'availability',
      'certifications',
      'education',
      'experienceLevel',
      'location',
      'referenceNumber',
      'skills',
    ]);
  });

  it('leaks no identifying data anywhere in the search response', async () => {
    const { token } = await createRecruiter();
    await createCandidate({ status: CANDIDATE_STATUSES.APPROVED });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool')
      .set('Authorization', bearer(token));

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
    CANDIDATE_STATUSES.PAYMENT_PENDING,
    CANDIDATE_STATUSES.PAYMENT_CONFIRMED,
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
    // Identical responses, so this cannot be used to probe which references exist.
    expect(unapproved.body.message).toBe(missing.body.message);
  });

  it('filters by skill without matching unrelated candidates', async () => {
    const { token } = await createRecruiter();
    await createCandidate({ status: CANDIDATE_STATUSES.APPROVED, overrides: { skills: ['React'] } });
    await createCandidate({ status: CANDIDATE_STATUSES.APPROVED, overrides: { skills: ['Welding'] } });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool?skills=React')
      .set('Authorization', bearer(token));

    expect(response.body.data.candidates).toHaveLength(1);
    expect(response.body.data.candidates[0].skills).toContain('React');
  });

  it('requires every requested skill, not just one of them', async () => {
    const { token } = await createRecruiter();
    await createCandidate({ status: CANDIDATE_STATUSES.APPROVED, overrides: { skills: ['React'] } });
    await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { skills: ['React', 'SQL'] },
    });

    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool?skills=React,SQL')
      .set('Authorization', bearer(token));

    expect(response.body.data.candidates).toHaveLength(1);
  });

  it('treats a regex metacharacter in a filter as a literal', async () => {
    const { token } = await createRecruiter();
    await createCandidate({
      status: CANDIDATE_STATUSES.APPROVED,
      overrides: { location: 'Ikeja, Lagos' },
    });

    // Unescaped, `.*` would match everything and expose the whole pool.
    const response = await request(app)
      .get('/api/v1/recruiter/talent-pool?location=.*')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data.candidates).toHaveLength(0);
  });
});
