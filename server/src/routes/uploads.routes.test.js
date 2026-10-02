import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { bearer, createAuthedUser } from '../test/factories.js';

// A 1x1 PNG — enough for multer to accept and reach the controller.
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('POST /api/v1/uploads', () => {
  it('rejects anonymous callers', async () => {
    const response = await request(app)
      .post('/api/v1/uploads')
      .attach('file', PNG_1PX, { filename: 'a.png', contentType: 'image/png' });

    expect(response.status).toBe(401);
  });

  it('rejects a talent uploading into the admin-only "content" folder', async () => {
    const { token } = await createAuthedUser({ role: USER_ROLES.TALENT });

    const response = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', bearer(token))
      .field('folder', 'content')
      .attach('file', PNG_1PX, { filename: 'a.png', contentType: 'image/png' });

    expect(response.status).toBe(403);
  });

  it('rejects an unsupported file type', async () => {
    const { token } = await createAuthedUser({ role: USER_ROLES.ADMIN });

    const response = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', bearer(token))
      .attach('file', Buffer.from('#!/bin/sh'), { filename: 'x.sh', contentType: 'application/x-sh' });

    expect(response.status).toBe(415);
  });

  it('returns 503 when Cloudinary is not configured', async () => {
    const { token } = await createAuthedUser({ role: USER_ROLES.ADMIN });

    const response = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', bearer(token))
      .field('folder', 'content')
      .attach('file', PNG_1PX, { filename: 'a.png', contentType: 'image/png' });

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
  });
});
