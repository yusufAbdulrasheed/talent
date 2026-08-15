import User from '../models/user.model.js';
import { loginUser, registerUser, serializeUser } from '../services/auth.service.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
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

function sendSession(response, session, status) {
  response.cookie(
    'refreshToken',
    session.refreshToken.token,
    getRefreshCookieOptions(session.refreshToken.expiresAt),
  );

  return sendSuccess(response, {
    status,
    data: { user: session.user, accessToken: session.accessToken },
  });
}

export const register = asyncHandler(async (request, response) => {
  const session = await registerUser(request.validated);
  await sendVerificationEmail(session.user.id);
  sendSession(response, session, 201);
});

export const login = asyncHandler(async (request, response) => {
  const session = await loginUser(request.validated);
  sendSession(response, session, 200);
});

export const refresh = asyncHandler(async (request, response) => {
  const token = request.cookies.refreshToken;

  if (!token) {
    throw new AppError('Your session has expired. Please sign in again.', 401);
  }

  const { user, refreshToken } = await rotateRefreshToken(token);

  sendSession(
    response,
    { user: serializeUser(user), accessToken: createAccessToken(user), refreshToken },
    200,
  );
});

export const logout = asyncHandler(async (request, response) => {
  await revokeRefreshToken(request.cookies.refreshToken);
  response.clearCookie('refreshToken', getClearedRefreshCookieOptions()).status(204).send();
});

export const currentUser = asyncHandler(async (request, response) => {
  sendSuccess(response, { data: { user: serializeUser(request.user) } });
});

export const verifyEmail = asyncHandler(async (request, response) => {
  await verifyUserEmail(request.validated.token);
  sendSuccess(response, { message: 'Email address verified.' });
});

export const resendVerification = asyncHandler(async (request, response) => {
  const { email } = request.validated;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (user && !user.isEmailVerified) {
    await sendVerificationEmail(user.id);
  }

  // Always the same response, so this endpoint cannot be used to discover
  // which addresses hold accounts.
  sendSuccess(response, {
    status: 202,
    message: 'If an account requires verification, an email has been sent.',
  });
});

export const requestPasswordReset = asyncHandler(async (request, response) => {
  await sendPasswordResetEmail(request.validated.email);
  sendSuccess(response, {
    status: 202,
    message: 'If an account exists, password reset instructions have been sent.',
  });
});

export const resetPassword = asyncHandler(async (request, response) => {
  const { token, password } = request.validated;
  await resetUserPassword(token, password);

  response.clearCookie('refreshToken', getClearedRefreshCookieOptions());
  sendSuccess(response, { message: 'Password reset successfully. Please sign in again.' });
});
