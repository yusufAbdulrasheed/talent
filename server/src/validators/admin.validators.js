import { z } from 'zod';
import { CANDIDATE_STATUSES, PLACEMENT_REQUEST_STATUSES } from '../constants/statuses.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier.');

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

/**
 * Statuses an administrator may set by hand. The earlier lifecycle states are
 * driven by the candidate and by payment confirmation, so allowing them here
 * would let an admin fake a payment.
 */
export const ADMIN_SETTABLE_CANDIDATE_STATUSES = Object.freeze([
  CANDIDATE_STATUSES.UNDER_REVIEW,
  CANDIDATE_STATUSES.APPROVED,
  CANDIDATE_STATUSES.REJECTED,
]);

export const candidateListQuerySchema = z
  .object({
    status: z.enum(Object.values(CANDIDATE_STATUSES)).optional(),
    search: z.string().trim().min(1).max(120).optional(),
    ...pagination,
  })
  .strict();

export const candidateStatusSchema = z
  .object({
    status: z.enum(ADMIN_SETTABLE_CANDIDATE_STATUSES),
    note: z.string().trim().max(2000).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === CANDIDATE_STATUSES.REJECTED && !value.note) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['note'],
        message: 'A note is required when rejecting a candidate, so they know why.',
      });
    }
  });

export const recruiterListQuerySchema = z
  .object({
    isApproved: z.enum(['true', 'false']).optional(),
    search: z.string().trim().min(1).max(120).optional(),
    ...pagination,
  })
  .strict();

export const recruiterApprovalSchema = z.object({ isApproved: z.boolean() }).strict();

export const createTrainerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(254),
  })
  .strict();

export const trainerStatusSchema = z.object({ isActive: z.boolean() }).strict();

export const programSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(4000).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const programUpdateSchema = programSchema.partial().strict();

export const assignmentSchema = z
  .object({
    trainer: objectId,
    program: objectId,
    batchName: z.string().trim().min(1).max(120),
    assignedCandidates: z.array(objectId).max(500).optional(),
    announcement: z.string().trim().max(1000).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const assignmentUpdateSchema = assignmentSchema.partial().strict();

export const paymentListQuerySchema = z
  .object({
    status: z.enum(['initialized', 'success', 'failed', 'abandoned']).optional(),
    reference: z.string().trim().min(3).max(100).optional(),
    ...pagination,
  })
  .strict();

export const placementListQuerySchema = z
  .object({
    status: z.enum(Object.values(PLACEMENT_REQUEST_STATUSES)).optional(),
    ...pagination,
  })
  .strict();

export const placementStatusSchema = z
  .object({
    status: z.enum(Object.values(PLACEMENT_REQUEST_STATUSES)),
    adminNote: z.string().trim().max(2000).optional(),
  })
  .strict();

export const contentSchema = z
  .object({
    type: z.enum(['testimonial', 'gallery_item', 'event', 'faq']),
    title: z.string().trim().min(2).max(200),
    body: z.string().trim().max(5000).optional(),
    imageUrl: z.string().trim().url().max(1000).optional(),
    eventDate: z.coerce.date().optional(),
    isPublished: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  })
  .strict();

export const contentUpdateSchema = contentSchema.partial().strict();

export const contentListQuerySchema = z
  .object({
    type: z.enum(['testimonial', 'gallery_item', 'event', 'faq']).optional(),
    ...pagination,
  })
  .strict();
