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
    // The limiter keeps in-process state, so without this one test file would
    // exhaust the budget for every test that follows it.
    skip: () => environment.NODE_ENV === 'test',
    message: { success: false, message },
  });
}

// Guards credential stuffing. Sized so that a handful of people sharing one
// office or mobile-carrier NAT do not lock each other out.
const credentialsLimiter = createLimiter({
  limit: 30,
  message: 'Too many authentication attempts. Please try again later.',
});

// Account-recovery routes each send an email, so they are budgeted separately
// and more tightly: the abuse here is using us to spam a third party.
const recoveryLimiter = createLimiter({
  limit: 12,
  message: 'Too many account recovery attempts. Please try again later.',
});

// Refresh runs on every page load, so it needs a far higher ceiling.
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
