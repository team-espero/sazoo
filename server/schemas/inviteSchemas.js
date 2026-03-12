import { z } from 'zod';

const languageSchema = z.enum(['en', 'ko', 'ja']);
const inviteTargetTabSchema = z.enum(['home', 'chat', 'calendar', 'miniapps', 'profile']);

const specialReportSchema = z.object({
  id: z.string().trim().min(1).max(120),
  type: z.literal('invite_comparison'),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(300),
  sourceInviteId: z.string().trim().min(1).max(120),
  unlockedAt: z.string().trim().min(1).max(80),
});

export const invitePayloadSchema = z.object({
  version: z.literal(1),
  inviteId: z.string().trim().min(1).max(120),
  source: z.literal('daily_fortune'),
  targetTab: inviteTargetTabSchema,
  inviterName: z.string().trim().min(1).max(80),
  previewTitle: z.string().trim().min(1).max(160),
  previewSummary: z.string().trim().min(1).max(240),
  comparisonSummary: z.string().trim().min(1).max(300),
  createdAt: z.string().trim().min(1).max(80),
});

export const inviteClaimRequestSchema = z.object({
  installationId: z.string().trim().min(8).max(120),
  userId: z.string().trim().min(6).max(128).optional(),
  language: languageSchema.default('ko'),
  invite: invitePayloadSchema,
});

export const inviteClaimResponseSchema = z.object({
  status: z.enum(['claimed', 'duplicate', 'self_invite_blocked']),
  coinReward: z.number().int().min(0).max(10),
  claimedAt: z.string().trim().min(1).max(80),
  specialReport: specialReportSchema.optional(),
});
