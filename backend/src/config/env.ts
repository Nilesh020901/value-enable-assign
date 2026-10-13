import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().default(''),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters long'),
  HMAC_SECRET: z.string().min(16, 'HMAC_SECRET must be at least 16 characters long'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
