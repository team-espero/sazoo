import { z } from 'zod';
import { walletIdentitySchema } from './walletSchemas.js';

export const walletPurchaseVerifyRequestSchema = walletIdentitySchema.extend({
  provider: z.literal('google_play').default('google_play'),
  bundleId: z.literal('yeopjeon_3_bundle').default('yeopjeon_3_bundle'),
  productId: z.literal('yeopjeon_3_bundle').default('yeopjeon_3_bundle'),
  purchaseToken: z.string().trim().min(12).max(512),
  packageName: z.string().trim().min(3).max(160).optional(),
});
