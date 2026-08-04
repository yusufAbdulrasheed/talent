import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import environment from '../config/env.js';
import RefreshToken from '../models/refresh-token.model.js';
import { AppError } from './app-error.js';

const ACCESS_TOKEN_DURATION = '15m';
const REFRESH_TOKEN_DURATION_DAYS = 7;

function requireAuthSecrets() {
  if (!environment.JWT_ACCESS_SECRET || !environment.JWT_REFRESH_SECRET) {
    throw new AppError('Authentication is not configured.', 503);
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createAccessToken(user) {
  requireAuthSecrets();

  return jwt.sign(
    { role: user.role, email: user.email },
    environment.JWT_ACCESS_SECRET,
    { subject: user.id, expiresIn: ACCESS_TOKEN_DURATION },
  );
}

export async function createRefreshToken(userId) {
  requireAuthSecrets();
  const token = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({ user: userId, tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt };
}

export async function rotateRefreshToken(token) {
  requireAuthSecrets();
  const existingToken = await RefreshToken.findOne({ tokenHash: hashToken(token), revokedAt: null }).populate('user');

  if (!existingToken || existingToken.expiresAt <= new Date() || !existingToken.user.isActive) {
    throw new AppError('Your session has expired. Please sign in again.', 401);
  }

  existingToken.revokedAt = new Date();
  await existingToken.save();

  const refreshToken = await createRefreshToken(existingToken.user.id);
  return { user: existingToken.user, refreshToken };
}

export async function revokeRefreshToken(token) {
  if (!token) {
    return;
  }

  await RefreshToken.updateOne(
    { tokenHash: hashToken(token), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export function getRefreshCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    secure: environment.NODE_ENV === 'production',
    sameSite: environment.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: expiresAt,
    path: '/api/v1/auth',
  };
}

export function getClearedRefreshCookieOptions() {
  return { ...getRefreshCookieOptions(new Date(0)), maxAge: 0 };
}
