import { z } from 'zod';

export const memoryIdentitySchema = z.object({
  installationId: z.string().trim().min(4).max(128),
  userId: z.string().trim().min(4).max(128).optional(),
  profileId: z.string().trim().min(1).max(128),
});

export const promptMemorySnapshotSchema = z.object({
  version: z.string().trim().min(1).max(64),
  knowledgeLevel: z.enum(['newbie', 'intermediate', 'expert']).default('newbie'),
  preferredTone: z.literal('mysterious_intimate').default('mysterious_intimate'),
  memoryQuality: z.enum(['seed', 'emerging', 'patterned', 'rich']).default('seed'),
  primaryConcerns: z.array(z.string().trim().min(1).max(40)).max(5).default([]),
  recurringTopics: z.array(z.string().trim().min(1).max(40)).max(5).default([]),
  relationshipContext: z.object({
    relation: z.string().trim().min(1).max(40),
    focus: z.string().trim().min(1).max(80).optional(),
  }).nullable().optional(),
  recentSummary: z.string().trim().max(320).optional(),
  conversationDigest: z.string().trim().max(420).optional(),
  journeySummary: z.string().trim().max(520).optional(),
  openLoops: z.array(z.string().trim().min(1).max(140)).max(4).optional(),
  lastAssistantGuidance: z.string().trim().max(220).optional(),
  lastUserQuestions: z.array(z.string().trim().min(1).max(120)).max(3).optional(),
});

export const memoryStateRequestSchema = memoryIdentitySchema.extend({
  snapshot: promptMemorySnapshotSchema.optional(),
});
