import { z } from 'zod';

const targetTabSchema = z.enum(['home', 'chat', 'calendar', 'miniapps', 'profile']);
const languageSchema = z.enum(['en', 'ko', 'ja']);

export const shareMetadataSchema = z.object({
  inviteId: z.string().min(1).max(120),
  source: z.literal('daily_fortune'),
  targetTab: targetTabSchema,
  inviterName: z.string().trim().min(1).max(80),
  previewTitle: z.string().trim().min(1).max(160),
  previewSummary: z.string().trim().min(1).max(420),
  comparisonSummary: z.string().trim().min(1).max(420),
  shareUrl: z.string().trim().url().max(2048),
  language: languageSchema.default('ko'),
  createdAt: z.string().datetime().optional(),
});

export const shareMetadataUpsertRequestSchema = z.object({
  installationId: z.string().min(4).max(160),
  userId: z.string().min(1).max(191).optional(),
  metadata: shareMetadataSchema,
});

export const shareMetadataStateRequestSchema = z.object({
  inviteId: z.string().min(1).max(120),
});
