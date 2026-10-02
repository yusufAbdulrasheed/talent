import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import environment from '../config/env.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { singleFile } from '../middleware/upload.middleware.js';
import { createUpload } from '../controllers/upload.controller.js';

const uploadRouter = Router();

// Uploads are authenticated and size-capped, but each one hits a third-party
// API, so keep a per-IP ceiling.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => environment.NODE_ENV === 'test',
  message: { success: false, message: 'Too many uploads. Please try again shortly.' },
});

uploadRouter.post('/', authenticate, uploadLimiter, singleFile, createUpload);

export default uploadRouter;
