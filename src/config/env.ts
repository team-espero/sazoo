import { z } from 'zod';

// Client env is intentionally limited to non-secret values.
const clientEnvSchema = z.object({
  VITE_APP_ENV: z.enum(['dev', 'staging', 'prod']).default('dev'),
  VITE_API_BASE_URL: z
    .string()
    .min(1, 'VITE_API_BASE_URL is required')
    .refine(
      (value) => value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://'),
      'VITE_API_BASE_URL must be a relative path or absolute URL',
    )
    .default('/api/v1'),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(65000),
});

const parsed = clientEnvSchema.safeParse({
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_API_TIMEOUT_MS: import.meta.env.VITE_API_TIMEOUT_MS,
});

if (!parsed.success) {
  const reason = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
  throw new Error(`Invalid client environment: ${reason}`);
}

const normalizedBaseUrl = parsed.data.VITE_API_BASE_URL.replace(/\/+$/, '');

export const clientEnv = {
  appEnv: parsed.data.VITE_APP_ENV,
  apiBaseUrl: normalizedBaseUrl,
  apiTimeoutMs: parsed.data.VITE_API_TIMEOUT_MS,
} as const;
