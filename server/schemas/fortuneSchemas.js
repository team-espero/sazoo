import { z } from 'zod';

const languageSchema = z.enum(['en', 'ko', 'ja']);
const lifecycleStageSchema = z.enum([
  'day1_activation',
  'day2_reopen',
  'day3_question_habit',
  'day4_tone_learning',
  'day5_discovery',
  'day6_pattern_preview',
  'day7_weekly_wrap',
  'pattern_building',
  'decision_support',
  'personal_os',
  'relationship_archive',
  'time_archive',
]);
const lifecycleModeSchema = z.enum(['product_led', 'memory_led']);
const promptModeSchema = z.enum([
  'chat',
  'day1_activation',
  'day2_reopen',
  'day3_question_habit',
  'day4_tone_learning',
  'day5_discovery',
  'day6_pattern_preview',
  'day7_weekly_wrap',
  'pattern_building',
  'decision_support',
  'personal_os',
  'relationship_archive',
  'time_archive',
  'ongoing_private_reading',
  'miniapp_couple',
  'miniapp_dream',
]);
const recentMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string().trim().min(1).max(500),
});

const promptMemorySchema = z.object({
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

export const chatRequestSchema = z.object({
  installationId: z.string().trim().min(4).max(128).optional(),
  userId: z.string().trim().min(4).max(128).optional(),
  message: z.string().trim().min(1).max(1500),
  language: languageSchema.default('ko'),
  profile: z.any().optional(),
  saju: z.any().optional(),
  isInitialAnalysis: z.boolean().optional().default(false),
  promptMode: promptModeSchema.optional().default('chat'),
  lifecycle: z.object({
    stage: lifecycleStageSchema.optional(),
    mode: lifecycleModeSchema.optional(),
    daysSinceOnboarding: z.number().int().min(0).max(5000).optional(),
    daysSinceFirstReading: z.number().int().min(0).max(5000).optional(),
    consecutiveVisitDays: z.number().int().min(0).max(5000).optional(),
  }).optional(),
  miniAppContext: z.any().optional(),
  memoryProfile: promptMemorySchema.optional(),
  recentMessages: z.array(recentMessageSchema).max(8).optional(),
});

export const chatResponseSchema = z.object({
  reply: z.string().trim().min(1).max(5000),
});

export const dailyInsightsRequestSchema = z.object({
  language: languageSchema.default('ko'),
  date: z.string().trim().min(1).optional(),
  profile: z.any().optional(),
  saju: z.any().optional(),
  lifecycle: z.object({
    stage: lifecycleStageSchema.optional(),
    mode: lifecycleModeSchema.optional(),
    daysSinceOnboarding: z.number().int().min(0).max(5000).optional(),
    daysSinceFirstReading: z.number().int().min(0).max(5000).optional(),
    consecutiveVisitDays: z.number().int().min(0).max(5000).optional(),
  }).optional(),
  memoryProfile: promptMemorySchema.optional(),
});

export const dailyInsightsResponseSchema = z.object({
  luckyItems: z
    .array(
      z.object({
        emoji: z.string().trim().min(1).max(4),
        name: z.string().trim().min(1).max(80),
        type: z.string().trim().min(1).max(40),
      }),
    )
    .min(1)
    .max(6),
  sajuTip: z.string().trim().min(1).max(280),
  elementTip: z.string().trim().min(1).max(280),
  energyTip: z.string().trim().min(1).max(280),
  cycleTip: z.string().trim().min(1).max(280),
  source: z.enum(['model', 'fallback']).optional(),
});
