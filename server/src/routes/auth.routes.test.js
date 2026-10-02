import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Stubbed at the transport boundary so the token that would reach the user's
// inbox can be read back and exercised for real.
vi.mock('../services/email.service.js', () => ({ sendEmail: vi.fn(async () => {}) }));

const { sendEmail } = await import('../services/email.service.js');

const app = (await import('../app.js')).default;
import User from '../models/user.model.js';
import Candidate from '../models/candidate.model.js';
import RecruiterCompany from '../models/recruiter-company.model.js';
import AccountToken from '../models/account-token.model.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { TEST_PASSWORD, bearer, createUser } from '../test/factories.js';

const talentPayload = {
  firstName: 'Ada',
  lastName: 'Obi',
  email: 'ada@example.test',
  password: TEST_PASSWORD,
  role: USER_ROLES.TALENT,
};

function refreshCookie(response) {
  return response.headers['set-cookie']?.find((cookie) => cookie.startsWith('refreshToken='));
}

/** Pulls the token out of the link in the most recently sent email. */
function tokenFromLastEmail() {
  const message = sendEmail.mock.calls.at(-1)?.[0];

  if (!message) {
    throw new Error('No email was sent.');
  }

  const link = message.text.match(/https?:\/\/\S+/)?.[0];
  return new URL(link).searchParams.get('token');
}

beforeEach(() => {
  sendEmail.mockClear();
});

describe('registration', () => {
  it('creates a talent with a candidate profile and a session', async () => {
    const response = await request(app).post('/api/v1/auth/register').send(talentPayload);

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe(USER_ROLES.TALENT);
    expect(response.body.data.accessToken).toBeTruthy();

    const candidate = await Candidate.findOne({ user: response.body.data.user.id });
    expect(candidate).not.toBeNull();
    expect(candidate.referenceNumber).toMatch(/^TAL-\d{4}-\d{5}$/);
  });

  it('creates a recruiter with a company record', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      ...talentPayload,
      email: 'ken@example.test',
      role: USER_ROLES.RECRUITER,
      companyName: 'Acme Nigeria',
    });

    expect(response.status).toBe(201);

    const company = await RecruiterCompany.findOne({ user: response.body.data.user.id });
    expect(company).not.toBeNull();
    expect(company.companyName).toBe('Acme Nigeria');
  });

  it('never returns the password hash', async () => {
    const response = await request(app).post('/api/v1/auth/register').send(talentPayload);

    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain(TEST_PASSWORD);
  });

  it('refuses to register an administrator', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...talentPayload, role: USER_ROLES.ADMIN });

    expect(response.status).toBe(422);
    expect(await User.countDocuments({ role: USER_ROLES.ADMIN })).toBe(0);
  });

  it('ignores an injected privilege field rather than trusting it', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...talentPayload, isAdmin: true, role: USER_ROLES.TALENT });

    expect(response.status).toBe(422);
  });

  it('requires a company name for recruiters', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...talentPayload, role: USER_ROLES.RECRUITER });

    expect(response.status).toBe(422);
    expect(response.body.details.some((detail) => detail.field === 'companyName')).toBe(true);
  });

  it('rejects a duplicate email without creating a second user', async () => {
    await request(app).post('/api/v1/auth/register').send(talentPayload);
    const response = await request(app).post('/api/v1/auth/register').send(talentPayload);

    expect(response.status).toBe(409);
    expect(await User.countDocuments({ email: talentPayload.email })).toBe(1);
  });

  it('issues sequential candidate references', async () => {
    await request(app).post('/api/v1/auth/register').send(talentPayload);
    await request(app)
      .post('/api/v1/auth/register')
      .send({ ...talentPayload, email: 'second@example.test' });

    const references = (await Candidate.find().sort({ createdAt: 1 })).map((c) => c.referenceNumber);
    const year = new Date().getFullYear();

    expect(references).toEqual([`TAL-${year}-00001`, `TAL-${year}-00002`]);
  });
});

describe('login', () => {
  it('signs in with valid credentials and sets an httpOnly refresh cookie', async () => {
    await createUser({ email: 'ada@example.test' });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.test', password: TEST_PASSWORD });

    expect(response.status).toBe(200);

    const cookie = refreshCookie(response);
    expect(cookie).toContain('HttpOnly');
    // The token must not be readable by scripts, and must not be in the body.
    expect(response.body.data).not.toHaveProperty('refreshToken');
  });

  it('rejects a wrong password with the same message as an unknown email', async () => {
    await createUser({ email: 'ada@example.test' });

    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.test', password: 'wrongpassword' });
    const unknownEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.test', password: TEST_PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    // Identical wording, so login cannot be used to enumerate accounts.
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it('refuses a deactivated account', async () => {
    await createUser({ email: 'ada@example.test', isActive: false });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.test', password: TEST_PASSWORD });

    expect(response.status).toBe(403);
  });
});

describe('session lifecycle', () => {
  it('rotates the refresh token and invalidates the old one', async () => {
    await createUser({ email: 'ada@example.test' });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.test', password: TEST_PASSWORD });

    const firstCookie = refreshCookie(login);

    const refreshed = await request(app).post('/api/v1/auth/refresh').set('Cookie', firstCookie);
    expect(refreshed.status).toBe(200);

    // Replaying the consumed token must fail: rotation is the whole point.
    const replay = await request(app).post('/api/v1/auth/refresh').set('Cookie', firstCookie);
    expect(replay.status).toBe(401);
  });

  it('rejects refresh when no cookie is present', async () => {
    const response = await request(app).post('/api/v1/auth/refresh');
    expect(response.status).toBe(401);
  });

  it('revokes the refresh token on logout', async () => {
    await createUser({ email: 'ada@example.test' });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.test', password: TEST_PASSWORD });
    const cookie = refreshCookie(login);

    await request(app).post('/api/v1/auth/logout').set('Cookie', cookie).expect(204);

    const afterLogout = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);
    expect(afterLogout.status).toBe(401);
  });
});

describe('email verification and password reset', () => {
  it('verifies an email with the token from the email and refuses to reuse it', async () => {
    const register = await request(app).post('/api/v1/auth/register').send(talentPayload);
    const userId = register.body.data.user.id;
    // Email verification is disabled for now (SKIP_EMAIL_VERIFICATION), so
    // registration itself no longer sends a verification email — force the
    // account unverified and request one explicitly to still exercise the
    // verify/replay mechanics end to end.
    await User.updateOne({ _id: userId }, { isEmailVerified: false });
    await request(app).post('/api/v1/auth/resend-verification').send({ email: talentPayload.email });
    const token = tokenFromLastEmail();

    const verified = await request(app).post('/api/v1/auth/verify-email').send({ token });
    expect(verified.status).toBe(200);
    expect((await User.findById(userId)).isEmailVerified).toBe(true);

    // Single use: the token is consumed, so a replay must fail.
    const replay = await request(app).post('/api/v1/auth/verify-email').send({ token });
    expect(replay.status).toBe(400);
  });

  it('stores verification tokens hashed, never in plain text', async () => {
    const register = await request(app).post('/api/v1/auth/register').send(talentPayload);
    await User.updateOne({ _id: register.body.data.user.id }, { isEmailVerified: false });
    await request(app).post('/api/v1/auth/resend-verification').send({ email: talentPayload.email });
    const token = tokenFromLastEmail();

    const stored = await AccountToken.findOne({ type: 'email_verification' });

    expect(stored.tokenHash).not.toBe(token);
    expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects an unknown verification token', async () => {
    const register = await request(app).post('/api/v1/auth/register').send(talentPayload);
    // Email verification is disabled for now (SKIP_EMAIL_VERIFICATION), so
    // registration already leaves the account verified; force it back to
    // unverified here so this test still isolates "an unknown token doesn't
    // verify" from that unrelated default.
    await User.updateOne({ _id: register.body.data.user.id }, { isEmailVerified: false });

    const response = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: 'x'.repeat(40) });

    expect(response.status).toBe(400);
    expect((await User.findById(register.body.data.user.id)).isEmailVerified).toBe(false);
  });

  it('resets the password and revokes every existing session', async () => {
    const user = await createUser({ email: 'ada@example.test' });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD });
    const oldCookie = refreshCookie(login);

    await request(app).post('/api/v1/auth/forgot-password').send({ email: user.email });
    const token = tokenFromLastEmail();

    const reset = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, password: 'brandnewpassword' });
    expect(reset.status).toBe(200);

    // The old password no longer works, the new one does.
    const oldPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD });
    expect(oldPassword.status).toBe(401);

    const newPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'brandnewpassword' });
    expect(newPassword.status).toBe(200);

    // A session opened before the reset must not outlive it.
    const staleSession = await request(app).post('/api/v1/auth/refresh').set('Cookie', oldCookie);
    expect(staleSession.status).toBe(401);
  });

  it('does not send an email for an unknown address', async () => {
    await request(app).post('/api/v1/auth/forgot-password').send({ email: 'nobody@example.test' });

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('answers the same way whether or not an account exists', async () => {
    await createUser({ email: 'ada@example.test' });

    const known = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'ada@example.test' });
    const unknown = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody@example.test' });

    expect(known.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(known.body.message).toBe(unknown.body.message);
  });

  it('rejects an expired reset token', async () => {
    const user = await createUser({ email: 'ada@example.test' });
    await request(app).post('/api/v1/auth/forgot-password').send({ email: user.email });
    const token = tokenFromLastEmail();

    const stored = await AccountToken.findOne({ user: user.id, type: 'password_reset' });
    stored.expiresAt = new Date(Date.now() - 1000);
    await stored.save();

    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, password: 'newpassword123' });

    expect(response.status).toBe(400);
    // The password must be unchanged: the old one still works.
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD });
    expect(login.status).toBe(200);
  });
});

describe('current user', () => {
  it('returns the signed-in user without sensitive fields', async () => {
    const register = await request(app).post('/api/v1/auth/register').send(talentPayload);

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', bearer(register.body.data.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(talentPayload.email);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });
});
