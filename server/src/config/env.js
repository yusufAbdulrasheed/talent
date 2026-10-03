import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/tms'),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_CALLBACK_URL: z
    .string()
    .url()
    .default('http://localhost:5173/recruiter/subscription/callback'),
  RECRUITER_SUB_INTERMEDIATE_NGN: z.coerce.number().positive().optional(),
  RECRUITER_SUB_SENIOR_NGN: z.coerce.number().positive().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error('Invalid environment configuration:', parsedEnvironment.error.flatten().fieldErrors);
  process.exit(1);
}

const environment = parsedEnvironment.data;

if (environment.NODE_ENV === 'production') {
  const requiredProductionValues = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'RESEND_API_KEY',
    'EMAIL_FROM',
  ];
  const missingValues = requiredProductionValues.filter((key) => !environment[key]);

  if (missingValues.length > 0) {
    console.error(`Missing required production environment values: ${missingValues.join(', ')}`);
    process.exit(1);
  }
}

export default environment;
