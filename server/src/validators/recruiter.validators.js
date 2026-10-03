import { z } from 'zod';
import { PLACEMENT_REQUEST_STATUSES } from '../constants/statuses.js';
import { SUBSCRIPTION_TIERS } from '../models/recruiter-subscription.model.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier.');

export const companyProfileSchema = z
  .object({
    cacNumber: z.string().trim().min(1).max(80).optional(),
    businessAddress: z.string().trim().max(500).optional(),
    companyEmail: z.string().trim().email().max(254).optional(),
    website: z.string().trim().url('Enter a valid URL, including https://').max(300).optional(),
    industry: z.string().trim().max(120).optional(),
    phoneNumber: z.string().trim().min(7).max(40).optional(),
    contactPerson: z.string().trim().max(160).optional(),
  })
  .strict();

export const talentPoolQuerySchema = z
  .object({
    location: z.string().trim().min(1).max(160).optional(),
    jobTitle: z.string().trim().min(1).max(160).optional(),
    skills: z
      .union([z.string(), z.array(z.string())])
      .transform((value) => (Array.isArray(value) ? value : value.split(',')))
      .transform((values) => values.map((item) => item.trim()).filter(Boolean))
      .pipe(z.array(z.string().max(80)).max(10))
      .optional(),
    certification: z.string().trim().min(1).max(160).optional(),
    program: objectId.optional(),
    keyword: z.string().trim().min(1).max(120).optional(),
    tier: z.enum(Object.values(SUBSCRIPTION_TIERS)).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict();

export const MAX_CANDIDATES_PER_REQUEST = 20;

const roleDetails = {
  jobTitle: z.string().trim().min(2).max(160),
  jobDescription: z.string().trim().min(10).max(6000),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'internship']),
  salaryRange: z.string().trim().max(120).optional(),
  location: z.string().trim().min(2).max(160),
  startDate: z.coerce.date().optional(),
  additionalNotes: z.string().trim().max(3000).optional(),
};

const candidateReference = z.string().trim().min(5).max(40);

export const placementRequestSchema = z
  .object({ candidateReference, ...roleDetails })
  .strict();

export const groupPlacementRequestSchema = z
  .object({
    candidateReferences: z
      .array(candidateReference)
      .min(1, 'Select at least one talent.')
      .max(MAX_CANDIDATES_PER_REQUEST, `Select at most ${MAX_CANDIDATES_PER_REQUEST} talents per request.`)
      .transform((references) => [...new Set(references.map((reference) => reference.toUpperCase()))]),
    ...roleDetails,
  })
  .strict();

export const subscriptionCheckoutSchema = z.object({ tier: z.enum(['intermediate', 'senior']) }).strict();

export const placementRequestQuerySchema = z
  .object({
    status: z.enum(Object.values(PLACEMENT_REQUEST_STATUSES)).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();
