import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import environment from '../config/env.js';
import {
  currentUser,
  login,
  logout,
  refresh,
  register,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  verifyEmail,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  tokenSchema,
} from '../validators/auth.validators.js';

const authRouter = Router();

function createLimiter({ limit, message }) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => environment.NODE_ENV === 'test',
    message: { success: false, message },
  });
}

const credentialsLimiter = createLimiter({
  limit: 30,
  message: 'Too many authentication attempts. Please try again later.',
});

const recoveryLimiter = createLimiter({
  limit: 12,
  message: 'Too many account recovery attempts. Please try again later.',
});

const refreshLimiter = createLimiter({
  limit: 120,
  message: 'Too many session refresh attempts. Please try again later.',
});

authRouter.post('/register', credentialsLimiter, validateBody(registerSchema), register);
authRouter.post('/login', credentialsLimiter, validateBody(loginSchema), login);
authRouter.post('/verify-email', recoveryLimiter, validateBody(tokenSchema), verifyEmail);
authRouter.post('/resend-verification', recoveryLimiter, validateBody(emailSchema), resendVerification);
authRouter.post('/forgot-password', recoveryLimiter, validateBody(emailSchema), requestPasswordReset);
authRouter.post('/reset-password', recoveryLimiter, validateBody(resetPasswordSchema), resetPassword);
authRouter.post('/refresh', refreshLimiter, refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, currentUser);

export default authRouter;
