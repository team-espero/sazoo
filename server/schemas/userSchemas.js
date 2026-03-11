import { z } from 'zod';

const birthDateSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  ampm: z.enum(['AM', 'PM']),
});

const profileSchema = z.object({
  id: z.string().trim().min(1).max(128),
  name: z.string().trim().max(80),
  gender: z.enum(['male', 'female']).nullable(),
  knowledgeLevel: z.enum(['newbie', 'intermediate', 'expert']).optional(),
  birthDate: birthDateSchema,
  calendarType: z.string().trim().min(1).max(40),
  isTimeUnknown: z.boolean(),
  relation: z.enum(['me', 'family', 'friend', 'lover', 'colleague']),
  memo: z.string().max(300).default(''),
  avatarId: z.number().int().min(0).max(999).optional(),
});

export const userStateIdentitySchema = z.object({
  installationId: z.string().trim().min(4).max(128),
  userId: z.string().trim().min(4).max(128).optional(),
});

export const userStateSnapshotSchema = z.object({
  profiles: z.array(profileSchema).max(32).default([]),
  activeProfileId: z.string().trim().min(1).max(128).default('me'),
  userTier: z.enum(['FREE', 'BASIC', 'PREMIUM']).default('FREE'),
  onboardingComplete: z.boolean().default(false),
});

export const userStateRequestSchema = userStateIdentitySchema.extend({
  snapshot: userStateSnapshotSchema.optional(),
});

export const userStateSaveRequestSchema = userStateIdentitySchema.extend({
  snapshot: userStateSnapshotSchema,
});

export const authPromotionRequestSchema = userStateIdentitySchema.extend({
  userId: z.string().trim().min(4).max(128),
  snapshot: userStateSnapshotSchema.optional(),
  specialReports: z.array(z.object({
    id: z.string().trim().min(1).max(160),
    type: z.literal('invite_comparison'),
    title: z.string().trim().min(1).max(160),
    summary: z.string().trim().min(1).max(500),
    sourceInviteId: z.string().trim().min(1).max(160),
    unlockedAt: z.string().trim().min(1).max(64),
  })).max(64).optional(),
});
