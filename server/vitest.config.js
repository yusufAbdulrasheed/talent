import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.js'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: 'test',
      CLIENT_URL: 'http://localhost:5173',
      JWT_ACCESS_SECRET: 'test-access-secret-long-enough-for-validation-0001',
      JWT_REFRESH_SECRET: 'test-refresh-secret-long-enough-for-validation-002',
      PAYSTACK_SECRET_KEY: 'sk_test_dummy_secret',
      TRAINING_FEE_NGN: '5000',
      RECRUITER_SUB_INTERMEDIATE_NGN: '15000',
      RECRUITER_SUB_SENIOR_NGN: '30000',
    },
  },
});
