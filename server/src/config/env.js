import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  // Number of reverse proxies in front of the app. Rate limiting keys on the
  // client IP, so behind a proxy this MUST be set (Render/Railway/Fly are
  // typically 1) or every user shares the proxy's IP and one bucket. Never set
  // it higher than the real hop count: each trusted hop is one more
  // X-Forwarded-For entry a client could forge.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/tms'),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  // Paystack signs webhooks with the secret key itself, so there is no
  // separate webhook secret to configure.
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_CALLBACK_URL: z
    .string()
    .url()
    .default('http://localhost:5173/recruiter/subscription/callback'),
  // Recruiter subscription pricing (NGN / month). Without a value the tier is
  // unavailable for purchase. `junior` is always the free default.
  RECRUITER_SUB_INTERMEDIATE_NGN: z.coerce.number().positive().optional(),
  RECRUITER_SUB_SENIOR_NGN: z.coerce.number().positive().optional(),
  // Transactional email is sent through Resend (https://resend.com). Without
  // both values the email service logs messages to the console instead.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  // Media (images, documents) are stored on Cloudinary. Without all three the
  // upload endpoint responds 503 and image fields accept a plain URL only.
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
