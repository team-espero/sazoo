import { z } from 'zod';
import { userStateIdentitySchema } from './userSchemas.js';

export const specialReportUnlockSchema = z.object({
  id: z.string().trim().min(1).max(160),
  type: z.literal('invite_comparison'),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(500),
  sourceInviteId: z.string().trim().min(1).max(160),
  unlockedAt: z.string().trim().min(1).max(64),
});

export const unlockStateRequestSchema = userStateIdentitySchema.extend({
  snapshot: z.array(specialReportUnlockSchema).max(64).optional(),
});

export const unlockUpsertRequestSchema = userStateIdentitySchema.extend({
  report: specialReportUnlockSchema,
});
