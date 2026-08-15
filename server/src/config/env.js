import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/tms'),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  // Paystack signs webhooks with the secret key itself, so there is no
  // separate webhook secret to configure.
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_CALLBACK_URL: z.string().url().default('http://localhost:5173/talent/payment/callback'),
  TRAINING_FEE_NGN: z.coerce.number().positive().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
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
    'PAYSTACK_SECRET_KEY',
    'TRAINING_FEE_NGN',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'SMTP_FROM',
  ];
  const missingValues = requiredProductionValues.filter((key) => !environment[key]);

  if (missingValues.length > 0) {
    console.error(`Missing required production environment values: ${missingValues.join(', ')}`);
    process.exit(1);
  }
}

export default environment;
