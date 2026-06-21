import { z } from 'zod';

const envSchema = z.object({
  // General
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('Brainwave EduSys'),

  // Backend API
  API_PORT: z.coerce.number().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  API_URL: z.string().url().default('http://localhost:4000'),

  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().default(''),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Master User (Seed)
  MASTER_EMAIL: z.string().email().default('master@brainwave.edu'),
  MASTER_PASSWORD: z.string().min(6).default('Master@123'),
  MASTER_NAME: z.string().default('System Master'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(5),

  // File Upload
  UPLOAD_DIR: z.string().default('./data/uploads'),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().default(5),

  // WhatsApp API
  WHATSAPP_API_URL: z.string().default('https://api.example.com/whatsapp'),
  WHATSAPP_API_KEY: z.string().default(''),
  WHATSAPP_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  // VAPID (Web Push)
  VAPID_PUBLIC_KEY: z.string().default(''),
  VAPID_PRIVATE_KEY: z.string().default(''),
  VAPID_EMAIL: z.string().default('mailto:admin@brainwave.edu'),

  // Email
  EMAIL_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  // Logging
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('debug'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`\n❌ Invalid environment variables:\n${formatted}\n`);
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
