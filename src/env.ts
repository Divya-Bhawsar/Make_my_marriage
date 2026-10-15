import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default('mongodb://localhost:27017/make_my_marriage'),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters long')
    .default('local-development-session-secret-must-be-at-least-32-chars-long'),

  // Deferred Third-Party Integrations (Optional in initial scaffold)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  CRON_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    console.error('❌ Invalid or missing environment configuration:', errors);
    throw new Error(`Invalid environment configuration: ${JSON.stringify(errors)}`);
  }

  const data = result.data;

  // Extra safety check in production runtime (bypass during static build phase)
  const isBuilding =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.npm_lifecycle_event === 'build';

  if (
    data.NODE_ENV === 'production' &&
    !isBuilding &&
    data.SESSION_SECRET.includes('local-development-session-secret')
  ) {
    throw new Error('SESSION_SECRET must be configured with a secure production secret.');
  }

  return data;
}

export const env = parseEnv();
