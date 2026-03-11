import { z } from 'zod';
import { userStateIdentitySchema } from './userSchemas.js';

export const chatSummarySnapshotSchema = z.object({
  recentSummary: z.string().trim().max(320).default(''),
  conversationDigest: z.string().trim().max(420).default(''),
  openLoops: z.array(z.string().trim().min(1).max(140)).max(4).default([]),
  lastAssistantGuidance: z.string().trim().max(220).default(''),
  updatedAt: z.string().trim().min(1).max(64).optional(),
});

export const chatSummaryStateRequestSchema = userStateIdentitySchema.extend({
  profileId: z.string().trim().min(1).max(128),
  snapshot: chatSummarySnapshotSchema.optional(),
});

export const chatSummaryListRequestSchema = userStateIdentitySchema;
