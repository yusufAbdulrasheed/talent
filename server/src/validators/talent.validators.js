import { z } from 'zod';

export const talentProfileSchema = z
  .object({
    phoneNumber: z.string().trim().min(7).max(40).optional(),
    gender: z.enum(['female', 'male', 'prefer_not_to_say']).optional(),
    dateOfBirth: z.coerce.date().optional(),
    location: z.string().trim().min(2).max(160).optional(),
    education: z.string().trim().max(1000).optional(),
    skills: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    certifications: z.array(z.string().trim().min(1).max(160)).max(30).optional(),
    workExperience: z.string().trim().max(4000).optional(),
    availability: z.enum(['immediate', 'two_weeks', 'one_month', 'not_available']).optional(),
    experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior']).optional(),
  })
  .strict();
