import { z } from 'zod';

const providerSchema = z.literal('DARO');
const spendSourceSchema = z.enum(['free', 'paid']);

export const walletIdentitySchema = z.object({
  installationId: z.string().trim().min(8).max(120),
  userId: z.string().trim().min(6).max(128).optional(),
});

export const walletBalanceSchema = z.object({
  freeCoins: z.number().int().min(0).max(3),
  lastRefillTime: z.number().int().nonnegative(),
  freeCoinsExpireAt: z.number().int().positive(),
  paidCoins: z.number().int().min(0).max(9999),
  adsWatchedToday: z.number().int().min(0).max(5),
  lastAdResetTime: z.number().int().nonnegative(),
  totalCoinsUsed: z.number().int().min(0).max(999999),
});

export const walletStateRequestSchema = walletIdentitySchema.extend({
  snapshot: walletBalanceSchema.partial().optional(),
});

export const walletLedgerRequestSchema = walletIdentitySchema.extend({
  limit: z.number().int().min(1).max(100).default(50),
});

export const walletSpendRequestSchema = walletIdentitySchema.extend({
  context: z.string().trim().min(1).max(80).default('generic'),
});

export const walletRefundRequestSchema = walletIdentitySchema.extend({
  source: spendSourceSchema,
  reason: z.string().trim().min(1).max(80).default('request_failed'),
});

export const walletPurchaseRequestSchema = walletIdentitySchema.extend({
  bundleId: z.literal('yeopjeon_3_bundle').default('yeopjeon_3_bundle'),
});

export const walletCreditRequestSchema = walletIdentitySchema.extend({
  amount: z.number().int().min(1).max(20),
  reason: z.enum(['earned_from_invite', 'manual_adjustment']).default('manual_adjustment'),
});

export const walletRewardedAdClaimRequestSchema = walletIdentitySchema.extend({
  provider: providerSchema.default('DARO'),
  placementId: z.string().trim().min(1).max(120).default('daily_reward_default'),
  rewardClaimId: z.string().trim().min(8).max(160),
});
