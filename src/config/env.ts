import { z } from 'zod';

export const normalizeClientEnvString = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) {
      return trimmed.slice(1, -1).trim();
    }
  }

  return trimmed;
};

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
  VITE_KAKAO_JAVASCRIPT_KEY: z.string().optional().default(''),
  VITE_KAKAO_REDIRECT_URI: z.string().optional().default(''),
});

const parsed = clientEnvSchema.safeParse({
  VITE_APP_ENV: normalizeClientEnvString(import.meta.env.VITE_APP_ENV),
  VITE_API_BASE_URL: normalizeClientEnvString(import.meta.env.VITE_API_BASE_URL),
  VITE_API_TIMEOUT_MS: normalizeClientEnvString(import.meta.env.VITE_API_TIMEOUT_MS),
  VITE_KAKAO_JAVASCRIPT_KEY: normalizeClientEnvString(import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY),
  VITE_KAKAO_REDIRECT_URI: normalizeClientEnvString(import.meta.env.VITE_KAKAO_REDIRECT_URI),
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
  kakaoJavascriptKey: parsed.data.VITE_KAKAO_JAVASCRIPT_KEY.trim(),
  kakaoRedirectUri: parsed.data.VITE_KAKAO_REDIRECT_URI.trim(),
} as const;
