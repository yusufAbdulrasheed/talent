import { z } from 'zod';
import { USER_ROLES } from '../constants/user-roles.js';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must be at most 128 characters.');

const emailField = z.string().trim().email('Enter a valid email address.').max(254);

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required.').max(80),
    lastName: z.string().trim().min(1, 'Last name is required.').max(80),
    email: emailField,
    password: passwordSchema,
    role: z.enum([USER_ROLES.TALENT, USER_ROLES.RECRUITER]),
    companyName: z.string().trim().min(2).max(160).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.role === USER_ROLES.RECRUITER && !value.companyName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyName'],
        message: 'Company name is required for recruiter accounts.',
      });
    }
  });

export const loginSchema = z
  .object({
    email: emailField,
    password: passwordSchema,
  })
  .strict();

export const tokenSchema = z.object({ token: z.string().min(20).max(200) }).strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: passwordSchema,
  })
  .strict();

export const emailSchema = z.object({ email: emailField }).strict();
