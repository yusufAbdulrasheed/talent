import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import AccountToken from '../models/account-token.model.js';
import RefreshToken from '../models/refresh-token.model.js';
import User from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { sendEmail } from './email.service.js';
import { passwordResetEmail, trainerInviteEmail, verificationEmail } from './email-templates.js';

const TOKEN_DURATION_MS = 60 * 60 * 1000;
const PASSWORD_SALT_ROUNDS = 12;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueToken(user, type) {
  await AccountToken.deleteMany({ user: user.id, type });

  const token = crypto.randomBytes(32).toString('base64url');
  await AccountToken.create({
    user: user.id,
    type,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TOKEN_DURATION_MS),
  });

  return token;
}

async function consumeToken(token, type) {
  const accountToken = await AccountToken.findOne({ tokenHash: hashToken(token), type }).populate('user');

  if (!accountToken || accountToken.expiresAt <= new Date()) {
    throw new AppError('This link is invalid or has expired.', 400);
  }

  await AccountToken.deleteOne({ _id: accountToken.id });
  return accountToken.user;
}

export async function sendVerificationEmail(userId) {
  const user = await User.findById(userId);

  if (!user || user.isEmailVerified) {
    return;
  }

  const token = await issueToken(user, 'email_verification');
  const message = verificationEmail({ firstName: user.firstName, token });

  await sendEmail({ to: user.email, ...message });
}

export async function verifyEmail(token) {
  const user = await consumeToken(token, 'email_verification');
  user.isEmailVerified = true;
  await user.save();
}

export async function sendPasswordResetEmail(email) {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !user.isActive) {
    return;
  }

  const token = await issueToken(user, 'password_reset');
  const message = passwordResetEmail({ firstName: user.firstName, token });

  await sendEmail({ to: user.email, ...message });
}

export async function sendTrainerInvite(userId) {
  const user = await User.findById(userId);

  if (!user) {
    return;
  }

  const token = await issueToken(user, 'password_reset');
  const message = trainerInviteEmail({ firstName: user.firstName, token });

  await sendEmail({ to: user.email, ...message });
}

export async function resetPassword(token, password) {
  const user = await consumeToken(token, 'password_reset');
  user.passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  await user.save();

  await RefreshToken.updateMany(
    { user: user.id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}
