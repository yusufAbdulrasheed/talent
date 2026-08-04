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

const authRouter = Router();

const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

authRouter.post('/register', authenticationLimiter, register);
authRouter.post('/login', authenticationLimiter, login);
authRouter.post('/verify-email', authenticationLimiter, verifyEmail);
authRouter.post('/resend-verification', authenticationLimiter, resendVerification);
authRouter.post('/forgot-password', authenticationLimiter, requestPasswordReset);
authRouter.post('/reset-password', authenticationLimiter, resetPassword);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, currentUser);

export default authRouter;
