import { z } from 'zod';
import { PLACEMENT_REQUEST_STATUSES } from '../constants/statuses.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier.');

export const companyProfileSchema = z
  .object({
    companyName: z.string().trim().min(2).max(160).optional(),
    cacNumber: z.string().trim().max(80).optional(),
    businessAddress: z.string().trim().max(500).optional(),
    companyEmail: z.string().trim().email().max(254).optional(),
    website: z.string().trim().url('Enter a valid URL, including https://').max(300).optional(),
    industry: z.string().trim().max(120).optional(),
    phoneNumber: z.string().trim().min(7).max(40).optional(),
    contactPerson: z.string().trim().max(160).optional(),
  })
  .strict();

// Query values arrive as strings, so list and number fields are coerced here.
export const talentPoolQuerySchema = z
  .object({
    location: z.string().trim().min(1).max(160).optional(),
    skills: z
      .union([z.string(), z.array(z.string())])
      .transform((value) => (Array.isArray(value) ? value : value.split(',')))
      .transform((values) => values.map((item) => item.trim()).filter(Boolean))
      .pipe(z.array(z.string().max(80)).max(10))
      .optional(),
    certification: z.string().trim().min(1).max(160).optional(),
    availability: z.enum(['immediate', 'two_weeks', 'one_month', 'not_available']).optional(),
    experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior']).optional(),
    program: objectId.optional(),
    keyword: z.string().trim().min(1).max(120).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict();

export const placementRequestSchema = z
  .object({
    // Recruiters only ever know a candidate by reference, never by id.
    candidateReference: z.string().trim().min(5).max(40),
    jobTitle: z.string().trim().min(2).max(160),
    jobDescription: z.string().trim().min(10).max(6000),
    employmentType: z.enum(['full_time', 'part_time', 'contract', 'internship']),
    salaryRange: z.string().trim().max(120).optional(),
    location: z.string().trim().min(2).max(160),
    startDate: z.coerce.date().optional(),
    numberRequired: z.coerce.number().int().min(1).max(100).default(1),
    additionalNotes: z.string().trim().max(3000).optional(),
  })
  .strict();

export const placementRequestQuerySchema = z
  .object({
    status: z.enum(Object.values(PLACEMENT_REQUEST_STATUSES)).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();
