import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

loadDotenv();
loadDotenv({ path: '.env.local', override: true });

const stripWrappingQuotes = (value) => {
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

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  API_PREFIX: z.string().min(1).default('/api/v1'),
  DATABASE_URL: z.string().default(''),
  GEMINI_API_KEY: z.string().trim().min(20, 'GEMINI_API_KEY is required'),
  GEMINI_CHAT_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  GEMINI_INSIGHTS_MODEL: z.string().min(1).default('gemini-2.5-flash-lite'),
  CORS_ORIGINS: z.string().min(1).default('http://localhost:5173,http://127.0.0.1:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  ANALYTICS_LOG_PATH: z.string().min(1).default('server/data/client-events.jsonl'),
  INVITE_CLAIMS_PATH: z.string().min(1).default('server/data/invite-claims.json'),
  LAUNCH_DB_PATH: z.string().min(1).default('server/data/sazoo-launch.sqlite'),
  WALLET_STORE_PATH: z.string().min(1).default('server/data/wallet-store.json'),
  WALLET_DB_PATH: z.string().min(1).default('server/data/wallet-ledger.sqlite'),
  PROFILE_MEMORY_DB_PATH: z.string().min(1).default('server/data/profile-memory.sqlite'),
  KAKAO_REST_API_KEY: z.string().default(''),
  KAKAO_CLIENT_SECRET: z.string().default(''),
  KAKAO_ALLOWED_REDIRECT_URIS: z.string().default(''),
  GOOGLE_PLAY_PACKAGE_NAME: z.string().min(1).default('com.sazoo.app'),
  GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL: z.string().default(''),
  GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().default(''),
});

const normalizeOrigins = (rawOrigins) =>
  rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const normalizeUris = (rawUris) =>
  rawUris
    .split(',')
    .map((uri) => uri.trim())
    .filter(Boolean);

const isVercelRuntime = (source) => {
  const value = source?.VERCEL;
  return value === '1' || value === 'true' || value === 'yes';
};

const buildDefaultDataRoot = (source) => (isVercelRuntime(source) ? '/tmp/sazoo-data' : 'server/data');

const buildDefaultCorsOrigins = (source) => {
  const origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5180',
    'http://127.0.0.1:5180',
  ];

  const vercelUrls = [
    source?.VERCEL_URL,
    source?.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter(Boolean);

  for (const host of vercelUrls) {
    origins.push(`https://${String(host).replace(/^https?:\/\//, '')}`);
  }

  return Array.from(new Set(origins)).join(',');
};

const buildDefaultKakaoRedirectUris = (source) => {
  const hosts = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5180',
    'http://127.0.0.1:5180',
  ];

  const vercelUrls = [
    source?.VERCEL_URL,
    source?.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter(Boolean);

  for (const host of vercelUrls) {
    hosts.push(`https://${String(host).replace(/^https?:\/\//, '')}`);
  }

  return Array.from(new Set(hosts)).map((origin) => `${origin}/auth/kakao/callback`).join(',');
};

const normalizeSource = (source = {}) => Object.fromEntries(
  Object.entries(source).map(([key, value]) => [key, stripWrappingQuotes(value)]),
);

const withServerDefaults = (source = {}) => {
  const normalizedSource = normalizeSource(source);
  const dataRoot = buildDefaultDataRoot(source);

  return {
    ...normalizedSource,
    CORS_ORIGINS: normalizedSource.CORS_ORIGINS || buildDefaultCorsOrigins(normalizedSource),
    ANALYTICS_LOG_PATH: normalizedSource.ANALYTICS_LOG_PATH || path.join(dataRoot, 'client-events.jsonl'),
    INVITE_CLAIMS_PATH: normalizedSource.INVITE_CLAIMS_PATH || path.join(dataRoot, 'invite-claims.json'),
    LAUNCH_DB_PATH: normalizedSource.LAUNCH_DB_PATH || path.join(dataRoot, 'sazoo-launch.sqlite'),
    WALLET_STORE_PATH: normalizedSource.WALLET_STORE_PATH || path.join(dataRoot, 'wallet-store.json'),
    WALLET_DB_PATH: normalizedSource.WALLET_DB_PATH || path.join(dataRoot, 'wallet-ledger.sqlite'),
    PROFILE_MEMORY_DB_PATH: normalizedSource.PROFILE_MEMORY_DB_PATH || path.join(dataRoot, 'profile-memory.sqlite'),
    KAKAO_ALLOWED_REDIRECT_URIS: normalizedSource.KAKAO_ALLOWED_REDIRECT_URIS || buildDefaultKakaoRedirectUris(normalizedSource),
  };
};

export function parseServerEnv(source) {
  const parsed = serverEnvSchema.safeParse(withServerDefaults(source));
  if (!parsed.success) {
    const reason = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    throw new Error(`Invalid server environment: ${reason}`);
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    apiPrefix: parsed.data.API_PREFIX.replace(/\/+$/, ''),
    databaseUrl: parsed.data.DATABASE_URL,
    geminiApiKey: parsed.data.GEMINI_API_KEY.trim(),
    geminiChatModel: parsed.data.GEMINI_CHAT_MODEL,
    geminiInsightsModel: parsed.data.GEMINI_INSIGHTS_MODEL,
    corsOrigins: normalizeOrigins(parsed.data.CORS_ORIGINS),
    rateLimitWindowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: parsed.data.RATE_LIMIT_MAX,
    logLevel: parsed.data.LOG_LEVEL,
    analyticsLogPath: parsed.data.ANALYTICS_LOG_PATH,
    inviteClaimsPath: parsed.data.INVITE_CLAIMS_PATH,
    launchDbPath: parsed.data.LAUNCH_DB_PATH,
    walletStorePath: parsed.data.WALLET_STORE_PATH,
    walletDbPath: parsed.data.WALLET_DB_PATH,
    profileMemoryDbPath: parsed.data.PROFILE_MEMORY_DB_PATH,
    kakaoRestApiKey: parsed.data.KAKAO_REST_API_KEY,
    kakaoClientSecret: parsed.data.KAKAO_CLIENT_SECRET,
    kakaoAllowedRedirectUris: normalizeUris(parsed.data.KAKAO_ALLOWED_REDIRECT_URIS),
    googlePlayPackageName: parsed.data.GOOGLE_PLAY_PACKAGE_NAME,
    googlePlayServiceAccountEmail: parsed.data.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL,
    googlePlayServiceAccountPrivateKey: parsed.data.GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY,
  };
}

export function getServerEnv() {
  return parseServerEnv(process.env);
}
