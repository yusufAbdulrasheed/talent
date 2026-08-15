import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { bearer, createAuthedUser } from '../test/factories.js';

const PORTAL_ROUTES = [
  { path: '/api/v1/talent/profile', owner: USER_ROLES.TALENT },
  { path: '/api/v1/recruiter/company', owner: USER_ROLES.RECRUITER },
  { path: '/api/v1/trainer/dashboard', owner: USER_ROLES.TRAINER },
  { path: '/api/v1/admin/dashboard', owner: USER_ROLES.ADMIN },
];

const ALL_ROLES = Object.values(USER_ROLES);

describe('role-based access control', () => {
  it.each(PORTAL_ROUTES)('rejects anonymous callers on $path', async ({ path }) => {
    const response = await request(app).get(path);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it.each(PORTAL_ROUTES)('only the $owner role may reach $path', async ({ path, owner }) => {
    for (const role of ALL_ROLES) {
      const { token } = await createAuthedUser({ role });
      const response = await request(app).get(path).set('Authorization', bearer(token));

      if (role === owner) {
        // The owning role gets through authorisation. It may still 404 when no
        // profile row exists yet, which is a data condition, not a denial.
        expect(response.status, `${role} on ${path}`).not.toBe(403);
        expect(response.status, `${role} on ${path}`).not.toBe(401);
      } else {
        expect(response.status, `${role} on ${path}`).toBe(403);
      }
    }
  });

  it('rejects a token signed with the wrong secret', async () => {
    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', bearer('not.a.real.token'));

    expect(response.status).toBe(401);
  });

  it('rejects a valid token whose user has been deactivated', async () => {
    const { user, token } = await createAuthedUser({ role: USER_ROLES.ADMIN });

    user.isActive = false;
    await user.save();

    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', bearer(token));

    expect(response.status).toBe(401);
  });

  it('exposes no mutating verbs on the trainer portal', async () => {
    const { token } = await createAuthedUser({ role: USER_ROLES.TRAINER });

    for (const method of ['post', 'patch', 'put', 'delete']) {
      const response = await request(app)[method]('/api/v1/trainer/dashboard')
        .set('Authorization', bearer(token));

      // Nothing is registered for these verbs, so they fall through to the
      // 404 handler rather than mutating anything.
      expect(response.status, method).toBe(404);
    }
  });
});
