import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/email.service.js', () => ({ sendEmail: vi.fn(async () => {}) }));

const app = (await import('../app.js')).default;
const { default: PlacementRequest } = await import('../models/placement-request.model.js');
const { default: Notification } = await import('../models/notification.model.js');
const { default: RecruiterCompany } = await import('../models/recruiter-company.model.js');
const { USER_ROLES } = await import('../constants/user-roles.js');
const { CANDIDATE_STATUSES } = await import('../constants/statuses.js');
const { bearer, createCandidate, createRecruiter, createUser } = await import('../test/factories.js');

const ROLE = {
  jobTitle: 'Customer Service Officer',
  jobDescription: 'Front-desk and phone support for our Lagos office.',
  employmentType: 'full_time',
  location: 'Lagos',
};

// The free (junior) plan unlocks entry and junior candidates only.
const createJuniorCandidate = (overrides = {}) =>
  createCandidate({ overrides: { experienceLevel: 'junior', ...overrides } });

describe('recruiter company profile — locked identity fields', () => {
  it('rejects any attempt to change the company name', async () => {
    const { token, company } = await createRecruiter({ companyName: 'Acme Nigeria' });

    const response = await request(app)
      .patch('/api/v1/recruiter/company')
      .set('Authorization', bearer(token))
      .send({ companyName: 'Someone Else Ltd' });

    expect(response.status).toBe(422);
    expect((await RecruiterCompany.findById(company.id)).companyName).toBe('Acme Nigeria');
  });

  it('lets a CAC number be recorded once, then refuses to change it', async () => {
    const { token, company } = await createRecruiter();

    const first = await request(app)
      .patch('/api/v1/recruiter/company')
      .set('Authorization', bearer(token))
      .send({ cacNumber: 'rc123456' });
    expect(first.status).toBe(200);
    expect(first.body.data.company.cacNumber).toBe('RC123456');

    const same = await request(app)
      .patch('/api/v1/recruiter/company')
      .set('Authorization', bearer(token))
      .send({ cacNumber: 'RC123456', industry: 'Retail' });
    expect(same.status).toBe(200);

    const changed = await request(app)
      .patch('/api/v1/recruiter/company')
      .set('Authorization', bearer(token))
      .send({ cacNumber: 'RC999999' });
    expect(changed.status).toBe(403);
    expect((await RecruiterCompany.findById(company.id)).cacNumber).toBe('RC123456');
  });

  it('still saves the other company details', async () => {
    const { token } = await createRecruiter();

    const response = await request(app)
      .patch('/api/v1/recruiter/company')
      .set('Authorization', bearer(token))
      .send({ industry: 'Logistics', businessAddress: '12 Marina, Lagos' });

    expect(response.status).toBe(200);
    expect(response.body.data.company.industry).toBe('Logistics');
  });
});

describe('talent bio in the talent pool', () => {
  it('shows an unlocked candidate\'s bio to recruiters', async () => {
    const { token } = await createRecruiter();
    const { candidate } = await createJuniorCandidate({ bio: 'Detail-oriented administrator with a love of spreadsheets.' });

    const list = await request(app).get('/api/v1/recruiter/talent-pool').set('Authorization', bearer(token));
    const single = await request(app)
      .get(`/api/v1/recruiter/talent-pool/${candidate.referenceNumber}`)
      .set('Authorization', bearer(token));

    expect(list.body.data.candidates[0].bio).toBe('Detail-oriented administrator with a love of spreadsheets.');
    expect(single.body.data.candidate.bio).toBe('Detail-oriented administrator with a love of spreadsheets.');
  });
});

describe('placement requests', () => {
  it('no longer accepts a "number required" field', async () => {
    const { token } = await createRecruiter();
    const { candidate } = await createJuniorCandidate();

    const response = await request(app)
      .post('/api/v1/recruiter/placement-requests')
      .set('Authorization', bearer(token))
      .send({ ...ROLE, candidateReference: candidate.referenceNumber, numberRequired: 3 });

    expect(response.status).toBe(422);
  });

  it('creates one grouped request per selected talent and notifies admins once', async () => {
    await createUser({ role: USER_ROLES.ADMIN });
    const { token, company } = await createRecruiter();
    const { candidate: first } = await createJuniorCandidate();
    const { candidate: second } = await createJuniorCandidate();

    const response = await request(app)
      .post('/api/v1/recruiter/placement-requests/group')
      .set('Authorization', bearer(token))
      .send({ ...ROLE, candidateReferences: [first.referenceNumber, second.referenceNumber] });

    expect(response.status).toBe(201);
    expect(response.body.data.placementRequests).toHaveLength(2);

    const saved = await PlacementRequest.find({ recruiterCompany: company.id });
    expect(saved).toHaveLength(2);
    expect(new Set(saved.map((item) => item.groupId)).size).toBe(1);
    expect(saved[0].groupId).toBe(response.body.data.groupId);

    const notifications = await Notification.find({ type: 'placement_request.submitted' });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toContain('2 talents');
  });

  it('ignores duplicate selections', async () => {
    const { token } = await createRecruiter();
    const { candidate } = await createJuniorCandidate();

    const response = await request(app)
      .post('/api/v1/recruiter/placement-requests/group')
      .set('Authorization', bearer(token))
      .send({ ...ROLE, candidateReferences: [candidate.referenceNumber, candidate.referenceNumber.toLowerCase()] });

    expect(response.status).toBe(201);
    expect(response.body.data.placementRequests).toHaveLength(1);
  });

  it('rejects the whole group if any talent is outside the plan, saving nothing', async () => {
    const { token, company } = await createRecruiter();
    const { candidate: junior } = await createJuniorCandidate();
    const { candidate: senior } = await createCandidate({ overrides: { experienceLevel: 'senior' } });

    const response = await request(app)
      .post('/api/v1/recruiter/placement-requests/group')
      .set('Authorization', bearer(token))
      .send({ ...ROLE, candidateReferences: [junior.referenceNumber, senior.referenceNumber] });

    expect(response.status).toBe(403);
    expect(response.body.message).toContain(senior.referenceNumber);
    expect(await PlacementRequest.countDocuments({ recruiterCompany: company.id })).toBe(0);
  });

  it('rejects the group if a talent is not approved', async () => {
    const { token } = await createRecruiter();
    const { candidate: approved } = await createJuniorCandidate();
    const { candidate: pending } = await createCandidate({
      status: CANDIDATE_STATUSES.UNDER_REVIEW,
      overrides: { experienceLevel: 'junior' },
    });

    const response = await request(app)
      .post('/api/v1/recruiter/placement-requests/group')
      .set('Authorization', bearer(token))
      .send({ ...ROLE, candidateReferences: [approved.referenceNumber, pending.referenceNumber] });

    expect(response.status).toBe(404);
  });

  it('requires at least one talent', async () => {
    const { token } = await createRecruiter();

    const response = await request(app)
      .post('/api/v1/recruiter/placement-requests/group')
      .set('Authorization', bearer(token))
      .send({ ...ROLE, candidateReferences: [] });

    expect(response.status).toBe(422);
  });
});
