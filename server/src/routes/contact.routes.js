import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import environment from '../config/env.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { submitContactMessage } from '../controllers/contact.controller.js';

const contactRouter = Router();

// Each submission sends an email, so the abuse here is using us to spam a
// third party. Budget it tightly per IP.
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => environment.NODE_ENV === 'test',
  message: { success: false, message: 'Too many messages sent. Please try again later.' },
});

const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    subject: z.string().trim().max(150).optional(),
    message: z.string().trim().min(10).max(4000),
  })
  .strict();

contactRouter.post('/', contactLimiter, validateBody(contactSchema), submitContactMessage);

export default contactRouter;
