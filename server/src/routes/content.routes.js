import { Router } from 'express';
import { z } from 'zod';
import { validateQuery } from '../middleware/validate.middleware.js';
import { PUBLIC_CONTENT_TYPES } from '../models/public-content.model.js';
import {
  getPublicContentItem,
  listPublicContent,
} from '../controllers/public-content.controller.js';

const contentRouter = Router();

const publicContentQuerySchema = z
  .object({
    type: z.enum(PUBLIC_CONTENT_TYPES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict();

contentRouter.get('/', validateQuery(publicContentQuerySchema), listPublicContent);
contentRouter.get('/:id', getPublicContentItem);

export default contentRouter;
