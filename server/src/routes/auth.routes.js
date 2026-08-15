import { Router } from 'express';
import rateLimit from 'express-rate-limit';
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

// Guards credential stuffing and token brute-forcing.
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

// Refresh is called legitimately on every page load, so it gets a higher
// ceiling than the credential routes while still being bounded.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many session refresh attempts. Please try again later.' },
});

authRouter.post('/register', credentialsLimiter, validateBody(registerSchema), register);
authRouter.post('/login', credentialsLimiter, validateBody(loginSchema), login);
authRouter.post('/verify-email', credentialsLimiter, validateBody(tokenSchema), verifyEmail);
authRouter.post('/resend-verification', credentialsLimiter, validateBody(emailSchema), resendVerification);
authRouter.post('/forgot-password', credentialsLimiter, validateBody(emailSchema), requestPasswordReset);
authRouter.post('/reset-password', credentialsLimiter, validateBody(resetPasswordSchema), resetPassword);
authRouter.post('/refresh', refreshLimiter, refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, currentUser);

export default authRouter;
