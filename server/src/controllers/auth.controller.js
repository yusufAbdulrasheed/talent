import { z } from 'zod';
import { USER_ROLES } from '../constants/user-roles.js';
import User from '../models/user.model.js';
import { loginUser, registerUser, serializeUser } from '../services/auth.service.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createAccessToken,
  getClearedRefreshCookieOptions,
  getRefreshCookieOptions,
  revokeRefreshToken,
  rotateRefreshToken,
} from '../utils/auth-tokens.js';
import {
  resetPassword as resetUserPassword,
  sendPasswordResetEmail,
  sendVerificationEmail,
  verifyEmail as verifyUserEmail,
} from '../services/account-token.service.js';

const passwordSchema = z.string().min(8).max(128);

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  password: passwordSchema,
  role: z.enum([USER_ROLES.TALENT, USER_ROLES.RECRUITER]),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: passwordSchema,
});

const tokenSchema = z.object({ token: z.string().min(20).max(200) });

const resetPasswordSchema = tokenSchema.extend({ password: passwordSchema });

const emailSchema = z.object({ email: z.string().trim().email().max(254) });

function validate(schema, input) {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new AppError('Invalid request data.', 422);
  }

  return result.data;
}

function sendSession(response, session, statusCode) {
  response
    .cookie('refreshToken', session.refreshToken.token, getRefreshCookieOptions(session.refreshToken.expiresAt))
    .status(statusCode)
    .json({ success: true, data: { user: session.user, accessToken: session.accessToken } });
}

export const register = asyncHandler(async (request, response) => {
  const payload = validate(registerSchema, request.body);
  const session = await registerUser(payload);
  await sendVerificationEmail(session.user.id);
  sendSession(response, session, 201);
});

export const login = asyncHandler(async (request, response) => {
  const payload = validate(loginSchema, request.body);
  const session = await loginUser(payload);
  sendSession(response, session, 200);
});

export const refresh = asyncHandler(async (request, response) => {
  const token = request.cookies.refreshToken;

  if (!token) {
    throw new AppError('Your session has expired. Please sign in again.', 401);
  }

  const { user, refreshToken } = await rotateRefreshToken(token);
  const session = {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
    },
    accessToken: createAccessToken(user),
    refreshToken,
  };

  sendSession(response, session, 200);
});

export const logout = asyncHandler(async (request, response) => {
  await revokeRefreshToken(request.cookies.refreshToken);
  response.clearCookie('refreshToken', getClearedRefreshCookieOptions()).status(204).send();
});

export const currentUser = asyncHandler(async (request, response) => {
  response.status(200).json({ success: true, data: { user: serializeUser(request.user) } });
});

export const verifyEmail = asyncHandler(async (request, response) => {
  const { token } = validate(tokenSchema, request.body);
  await verifyUserEmail(token);
  response.status(200).json({ success: true, message: 'Email address verified.' });
});

export const resendVerification = asyncHandler(async (request, response) => {
  const { email } = validate(emailSchema, request.body);
  const user = await User.findOne({ email: email.toLowerCase() });

  if (user && !user.isEmailVerified) {
    await sendVerificationEmail(user.id);
  }

  response.status(202).json({ success: true, message: 'If an account requires verification, an email has been sent.' });
});

export const requestPasswordReset = asyncHandler(async (request, response) => {
  const { email } = validate(emailSchema, request.body);
  await sendPasswordResetEmail(email);
  response.status(202).json({ success: true, message: 'If an account exists, password reset instructions have been sent.' });
});

export const resetPassword = asyncHandler(async (request, response) => {
  const { token, password } = validate(resetPasswordSchema, request.body);
  await resetUserPassword(token, password);
  response.clearCookie('refreshToken', getClearedRefreshCookieOptions()).status(200).json({
    success: true,
    message: 'Password reset successfully. Please sign in again.',
  });
});
