import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.js'],
    // One in-memory mongod is shared, so test files must not run in parallel.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // The app reads configuration at import time. These values keep tests
    // hermetic: no .env is loaded, so the real database is never reachable.
    env: {
      NODE_ENV: 'test',
      CLIENT_URL: 'http://localhost:5173',
      JWT_ACCESS_SECRET: 'test-access-secret-long-enough-for-validation-0001',
      JWT_REFRESH_SECRET: 'test-refresh-secret-long-enough-for-validation-002',
      PAYSTACK_SECRET_KEY: 'sk_test_dummy_secret',
      TRAINING_FEE_NGN: '5000',
      // SMTP is intentionally unset: sendEmail logs instead of dialling out.
    },
  },
});
