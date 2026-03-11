import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();
loadDotenv({ path: '.env.local', override: true });

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  API_PREFIX: z.string().min(1).default('/api/v1'),
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
  GOOGLE_PLAY_PACKAGE_NAME: z.string().min(1).default('com.sazoo.app'),
  GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL: z.string().default(''),
  GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().default(''),
});

const normalizeOrigins = (rawOrigins) =>
  rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export function parseServerEnv(source) {
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) {
    const reason = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    throw new Error(`Invalid server environment: ${reason}`);
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    apiPrefix: parsed.data.API_PREFIX.replace(/\/+$/, ''),
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
    googlePlayPackageName: parsed.data.GOOGLE_PLAY_PACKAGE_NAME,
    googlePlayServiceAccountEmail: parsed.data.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL,
    googlePlayServiceAccountPrivateKey: parsed.data.GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY,
  };
}

export function getServerEnv() {
  return parseServerEnv(process.env);
}
