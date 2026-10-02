import { z } from 'zod';
import { CANDIDATE_DOCUMENT_TYPES } from '../models/candidate.model.js';

export const talentProfileSchema = z
  .object({
    phoneNumber: z.string().trim().min(7).max(40).optional(),
    gender: z.enum(['female', 'male', 'prefer_not_to_say']).optional(),
    dateOfBirth: z.coerce.date().optional(),
    location: z.string().trim().min(2).max(160).optional(),
    jobTitle: z.string().trim().min(2).max(160).optional(),
    bio: z.string().trim().max(600).optional(),
    education: z.string().trim().max(1000).optional(),
    skills: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    certifications: z.array(z.string().trim().min(1).max(160)).max(30).optional(),
    workExperience: z.string().trim().max(4000).optional(),
  })
  .strict();

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const documentSchema = z
  .object({
    type: z.enum(CANDIDATE_DOCUMENT_TYPES),
    url: z.string().trim().url().max(1000),
    publicId: z.string().trim().max(300).optional(),
    originalName: z.string().trim().min(1).max(300),
    mimeType: z.string().trim().min(3).max(120),
    size: z.number().int().min(1).max(MAX_DOCUMENT_BYTES),
  })
  .strict();

/**
 * Accepts a partial document set so the wizard can save progress; the
 * candidate only advances to "submitted" once `hasRequiredDocuments` passes
 * (enforced in the controller).
 */
export const talentDocumentsSchema = z
  .object({
    documents: z.array(documentSchema).max(20),
  })
  .strict()
  .superRefine((value, context) => {
    const seen = new Set();
    for (const document of value.documents) {
      // Everything except certificates is a single, replace-in-place slot.
      if (document.type !== 'certificate' && seen.has(document.type)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['documents'],
          message: `Only one ${document.type} document is allowed.`,
        });
      }
      seen.add(document.type);
    }
  });

export const savingsWithdrawalRequestSchema = z.object({ amount: z.coerce.number().positive() }).strict();

export const savingsParticipationSchema = z
  .object({ status: z.enum(['active', 'discontinued']) })
  .strict();
