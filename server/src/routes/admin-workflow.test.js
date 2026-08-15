import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/email.service.js', () => ({ sendEmail: vi.fn(async () => {}) }));

const { sendEmail } = await import('../services/email.service.js');
const app = (await import('../app.js')).default;

const { default: Candidate } = await import('../models/candidate.model.js');
const { default: PlacementRequest } = await import('../models/placement-request.model.js');
const { CANDIDATE_STATUSES, PLACEMENT_REQUEST_STATUSES } = await import('../constants/statuses.js');
const { USER_ROLES } = await import('../constants/user-roles.js');
const { bearer, createAuthedUser, createCandidate, createRecruiter } = await import('../test/factories.js');

async function admin() {
  const { token } = await createAuthedUser({ role: USER_ROLES.ADMIN });
  return token;
}

describe('candidate approval publishes to the talent pool', () => {
  it('approves a paid candidate and makes them visible to recruiters', async () => {
    const adminToken = await admin();
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.PAYMENT_CONFIRMED });
    const { token: recruiterToken } = await createRecruiter();

    const before = await request(app)
      .get('/api/v1/recruiter/talent-pool')
      .set('Authorization', bearer(recruiterToken));
    expect(before.body.data.candidates).toHaveLength(0);

    const approval = await request(app)
      .patch(`/api/v1/admin/candidates/${candidate.id}/status`)
      .set('Authorization', bearer(adminToken))
      .send({ status: CANDIDATE_STATUSES.APPROVED });
    expect(approval.status).toBe(200);

    const after = await request(app)
      .get('/api/v1/recruiter/talent-pool')
      .set('Authorization', bearer(recruiterToken));
    expect(after.body.data.candidates).toHaveLength(1);
    expect(after.body.data.candidates[0].referenceNumber).toBe(candidate.referenceNumber);
  });

  it('removes a candidate from the pool when approval is withdrawn', async () => {
    const adminToken = await admin();
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.APPROVED });
    const { token: recruiterToken } = await createRecruiter();

    await request(app)
      .patch(`/api/v1/admin/candidates/${candidate.id}/status`)
      .set('Authorization', bearer(adminToken))
      .send({ status: CANDIDATE_STATUSES.REJECTED, note: 'Documents could not be verified.' })
      .expect(200);

    const after = await request(app)
      .get('/api/v1/recruiter/talent-pool')
      .set('Authorization', bearer(recruiterToken));
    expect(after.body.data.candidates).toHaveLength(0);
  });

  it('refuses to approve a candidate who has not paid', async () => {
    const adminToken = await admin();
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.SUBMITTED });

    const response = await request(app)
      .patch(`/api/v1/admin/candidates/${candidate.id}/status`)
      .set('Authorization', bearer(adminToken))
      .send({ status: CANDIDATE_STATUSES.APPROVED });

    expect(response.status).toBe(409);
    expect((await Candidate.findById(candidate.id)).status).toBe(CANDIDATE_STATUSES.SUBMITTED);
  });

  it.each([
    CANDIDATE_STATUSES.DRAFT,
    CANDIDATE_STATUSES.SUBMITTED,
    CANDIDATE_STATUSES.PAYMENT_PENDING,
    CANDIDATE_STATUSES.PAYMENT_CONFIRMED,
  ])('refuses to let an administrator set the system-driven status %s', async (status) => {
    const adminToken = await admin();
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.UNDER_REVIEW });

    const response = await request(app)
      .patch(`/api/v1/admin/candidates/${candidate.id}/status`)
      .set('Authorization', bearer(adminToken))
      .send({ status });

    // Allowing these would let an administrator fake a training payment.
    expect(response.status).toBe(422);
  });

  it('requires a note when rejecting', async () => {
    const adminToken = await admin();
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.UNDER_REVIEW });

    const response = await request(app)
      .patch(`/api/v1/admin/candidates/${candidate.id}/status`)
      .set('Authorization', bearer(adminToken))
      .send({ status: CANDIDATE_STATUSES.REJECTED });

    expect(response.status).toBe(422);
    expect((await Candidate.findById(candidate.id)).status).toBe(CANDIDATE_STATUSES.UNDER_REVIEW);
  });

  it('emails the candidate on approval', async () => {
    const adminToken = await admin();
    const { candidate, user } = await createCandidate({
      status: CANDIDATE_STATUSES.PAYMENT_CONFIRMED,
    });
    sendEmail.mockClear();

    await request(app)
      .patch(`/api/v1/admin/candidates/${candidate.id}/status`)
      .set('Authorization', bearer(adminToken))
      .send({ status: CANDIDATE_STATUSES.APPROVED })
      .expect(200);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0].to).toBe(user.email);
  });

  it('shows identifying data to an administrator', async () => {
    const adminToken = await admin();
    const { candidate, user } = await createCandidate({ status: CANDIDATE_STATUSES.APPROVED });

    const response = await request(app)
      .get(`/api/v1/admin/candidates/${candidate.id}`)
      .set('Authorization', bearer(adminToken));

    // The admin review screen is the one place identity is legitimately visible.
    expect(response.status).toBe(200);
    expect(response.body.data.candidate.email).toBe(user.email);
    expect(response.body.data.candidate.phoneNumber).toBe('+2348012345678');
  });
});

describe('placement requests', () => {
  async function submitRequest(token, referenceNumber) {
    return request(app)
      .post('/api/v1/recruiter/placement-requests')
      .set('Authorization', bearer(token))
      .send({
        candidateReference: referenceNumber,
        jobTitle: 'Frontend Developer',
        jobDescription: 'We need a frontend developer for our team.',
        employmentType: 'full_time',
        location: 'Lagos',
      });
  }

  it('accepts a request for an approved candidate', async () => {
    const { token } = await createRecruiter();
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.APPROVED });

    const response = await submitRequest(token, candidate.referenceNumber);

    expect(response.status).toBe(201);
    expect(response.body.data.placementRequest.candidateReference).toBe(candidate.referenceNumber);
  });

  it('refuses a request for a candidate who is not in the pool', async () => {
    const { token } = await createRecruiter();
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.UNDER_REVIEW });

    const response = await submitRequest(token, candidate.referenceNumber);

    expect(response.status).toBe(404);
    expect(await PlacementRequest.countDocuments()).toBe(0);
  });

  it('notifies administrators when a request is submitted', async () => {
    await createAuthedUser({ role: USER_ROLES.ADMIN });
    const { token } = await createRecruiter();
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.APPROVED });
    sendEmail.mockClear();

    const created = await submitRequest(token, candidate.referenceNumber);
    expect(created.status).toBe(201);

    expect(sendEmail).toHaveBeenCalled();
  });

  it('never exposes one recruiter’s request to another', async () => {
    const first = await createRecruiter({ companyName: 'First Ltd' });
    const second = await createRecruiter({ companyName: 'Second Ltd' });
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.APPROVED });

    const created = await submitRequest(first.token, candidate.referenceNumber);
    const requestId = created.body.data.placementRequest.id;

    // Direct lookup with a valid id, from the wrong company.
    const crossRead = await request(app)
      .get(`/api/v1/recruiter/placement-requests/${requestId}`)
      .set('Authorization', bearer(second.token));
    expect(crossRead.status).toBe(404);

    const list = await request(app)
      .get('/api/v1/recruiter/placement-requests')
      .set('Authorization', bearer(second.token));
    expect(list.body.data.placementRequests).toHaveLength(0);
  });

  it('emails the recruiter when an administrator changes the status', async () => {
    const adminToken = await admin();
    const { token } = await createRecruiter();
    const { candidate } = await createCandidate({ status: CANDIDATE_STATUSES.APPROVED });
    const created = await submitRequest(token, candidate.referenceNumber);
    sendEmail.mockClear();

    const response = await request(app)
      .patch(`/api/v1/admin/placement-requests/${created.body.data.placementRequest.id}/status`)
      .set('Authorization', bearer(adminToken))
      .send({ status: PLACEMENT_REQUEST_STATUSES.IN_PROGRESS, adminNote: 'Contacting the candidate.' });

    expect(response.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
