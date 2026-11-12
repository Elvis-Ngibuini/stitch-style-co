const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().url().startsWith('mongodb'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRE: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRE: z.string().default('7d'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  FRONTEND_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional()
});

let env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment configuration:');
  error.errors.forEach(err => {
    console.error(`  - ${err.path.join('.')}: ${err.message}`);
  });
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
  console.warn('⚠️  Running with invalid config in development mode');
  env = { ...process.env };
  if (!env.JWT_REFRESH_SECRET) {
    env.JWT_REFRESH_SECRET = 'dev-refresh-secret-key-min-32-chars-long-for-testing';
  }
  if (!env.JWT_SECRET) {
    env.JWT_SECRET = 'dev-access-secret-key-min-32-chars-long-for-testing-only';
  }
  if (!env.JWT_EXPIRE) {
    env.JWT_EXPIRE = '15m';
  }
  if (!env.JWT_REFRESH_EXPIRE) {
    env.JWT_REFRESH_EXPIRE = '7d';
  }
  if (!env.STRIPE_SECRET_KEY) {
    env.STRIPE_SECRET_KEY = 'sk_test_dev';
  }
  if (!env.STRIPE_PUBLISHABLE_KEY) {
    env.STRIPE_PUBLISHABLE_KEY = 'pk_test_dev';
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    env.STRIPE_WEBHOOK_SECRET = 'whsec_dev';
  }
  if (!env.FRONTEND_URL) {
    env.FRONTEND_URL = 'http://localhost:3000';
  }
}

module.exports = env;