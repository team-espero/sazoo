import { describe, expect, it } from 'vitest';
import { buildChatPrompt } from './chatPrompt.js';
import { buildDailyInsightsPrompt } from './dailyInsightsPrompt.js';
import { resolveDailyInsightModeSelection, resolveMiniAppModeSelection, resolvePromptModeSelection } from './lifecycleModeSelection.js';
import { selectPromptMemoryPayload } from './memoryBudgetSelection.js';
import { buildCouplePrompt } from './miniApps/couplePrompt.js';
import { buildDreamPrompt } from './miniApps/dreamPrompt.js';
import { CONTINUATION_OPENINGS } from './shared.js';
import { buildFallbackDailyInsights, buildLocalChatReply } from './localFallbacks.js';

const BROKEN_TEXT_PATTERN = /\uFFFD|\?{2,}|\bundefined\b/u;

const profile = {
  id: 'me',
  name: 'Kim',
  gender: 'male',
  knowledgeLevel: 'newbie',
  birthDate: { year: 1993, month: 5, day: 6, hour: 11, minute: 30, ampm: 'AM' },
  calendarType: 'solar',
  isTimeUnknown: false,
  relation: 'me',
  memo: '',
};

const saju = {
  year: { stem: { kor: '갑', element: '목' }, branch: { kor: '술', element: '토' } },
  month: { stem: { kor: '무', element: '토' }, branch: { kor: '진', element: '토' } },
  day: { stem: { kor: '임', element: '수' }, branch: { kor: '자', element: '수' } },
  hour: { stem: { kor: '경', element: '금' }, branch: { kor: '오', element: '화' } },
};

const memoryProfile = {
  version: 'phase4.v3',
  knowledgeLevel: 'newbie',
  preferredTone: 'mysterious_intimate',
  memoryQuality: 'rich',
  primaryConcerns: ['love', 'career'],
  recurringTopics: ['love', 'career', 'timing'],
  relationshipContext: { relation: 'me', focus: 'love' },
  recentSummary: 'The user keeps returning to love and career. Most recent question: priorities first.',
  conversationDigest: 'Earlier conversations kept circling back to balancing emotional closeness with stable work timing.',
  journeySummary: 'The longer journey keeps returning to love, career, and timing. The user often reopens the reading when they are choosing between emotional courage and practical stability. Guidance lands best when it stays calm, specific, and action-led.',
  openLoops: ['Should I focus on love or work first?'],
  lastAssistantGuidance: 'Choose the smaller stabilizing move first, then widen the path once your footing is steady.',
  lastUserQuestions: ['Should I focus on love or work first?'],
};

const recentMessages = [
  { role: 'assistant' as const, text: 'Let us read this slowly.' },
  { role: 'user' as const, text: 'Both love and work feel unstable.' },
];

describe('prompt regression', () => {
  it('keeps the chat prompt contract stable without broken characters', () => {
    const prompt = buildChatPrompt({
      language: 'ko',
      message: '연애와 일이 모두 흔들리는 것 같아요.',
      profile,
      saju,
      isInitialAnalysis: false,
      promptMode: 'chat',
      lifecycle: {
        stage: 'day4_tone_learning',
        mode: 'product_led',
        daysSinceOnboarding: 3,
        daysSinceFirstReading: 3,
      },
      memoryProfile,
      recentMessages,
    });

    expect(prompt).toContain('Prompt version: 2026-03-12.phase4.v5');
    expect(prompt).toContain('interpretationPolicy:policy-1');
    expect(prompt).toContain('promptMode:mode-2');
    expect(prompt).toContain('Language: Korean.');
    expect(prompt).toContain(`Opening rule: begin with "${CONTINUATION_OPENINGS.ko}"`);
    expect(prompt).toContain('Resolved prompt mode: day4_tone_learning.');
    expect(prompt).toContain('Lifecycle mode: product_led.');
    expect(prompt).toContain('Memory budget preset: tone_probe.');
    expect(prompt).toContain('Response template:');
    expect(prompt).toContain('Verified saju summary:');
    expect(prompt).toContain('Memory version: phase4.v3');
    expect(prompt).toContain('Memory quality: rich');
    expect(prompt).toContain('Short-term dialogue memory:');
    expect(prompt).toContain('User message: 연애와 일이 모두 흔들리는 것 같아요.');
    expect(prompt).not.toMatch(BROKEN_TEXT_PATTERN);
  });

  it('embeds the allowed and forbidden interpretation rules in the main chat prompt', () => {
    const prompt = buildChatPrompt({
      language: 'en',
      message: 'Can you tell me if my life is doomed?',
      profile,
      saju,
      isInitialAnalysis: false,
      promptMode: 'decision_support',
      lifecycle: {
        stage: 'decision_support',
        mode: 'memory_led',
        daysSinceOnboarding: 40,
        daysSinceFirstReading: 35,
      },
      memoryProfile,
      recentMessages,
    });

    expect(prompt).toContain('Allowed rule: read patterns, tendencies, timing signals, and emotional structure rather than declaring fixed fate.');
    expect(prompt).toContain('Forbidden rule: never predict death, terminal illness, disasters, lawsuits, crimes, exact divorce, exact marriage, or guaranteed profits.');
    expect(prompt).toContain('Forbidden rule: never use fear, dependency, or urgency to increase retention.');
    expect(prompt).toContain('Forbidden rule: never give medical, legal, or financial certainty.');
    expect(prompt).toContain('Forbidden rule: never erase agency with lines such as nothing can change, your fate is fixed, or this is guaranteed.');
  });

  it('keeps the daily insights prompt contract stable', () => {
    const prompt = buildDailyInsightsPrompt({
      language: 'ko',
      date: '2026-03-12',
      profile,
      saju,
      lifecycle: {
        stage: 'decision_support',
        mode: 'memory_led',
        daysSinceFirstReading: 35,
      },
      memoryProfile,
    });

    expect(prompt).toContain('Prompt version: 2026-03-12.phase4.v5');
    expect(prompt).toContain('interpretationPolicy:policy-1');
    expect(prompt).toContain('Daily insight policy: no fear, no fatalistic prophecy, no exact event prediction.');
    expect(prompt).toContain('Resolved daily insight mode: daily_decision_signal.');
    expect(prompt).toContain('Memory budget preset: daily_pattern_compact.');
    expect(prompt).toContain('"luckyItems": [{"emoji":"string","name":"string","type":"string"}]');
    expect(prompt).not.toMatch(BROKEN_TEXT_PATTERN);
  });

  it('routes lifecycle stages into the intended prompt modes and presets', () => {
    const initialSelection = resolvePromptModeSelection({
      requestedPromptMode: 'chat',
      isInitialAnalysis: true,
    });
    const decisionSelection = resolvePromptModeSelection({
      requestedPromptMode: 'chat',
      lifecycle: {
        daysSinceFirstReading: 35,
      },
    });

    expect(initialSelection.promptMode).toBe('day1_activation');
    expect(initialSelection.lifecycleMode).toBe('product_led');
    expect(initialSelection.memoryBudgetPreset).toBe('day1_compact');

    expect(decisionSelection.promptMode).toBe('decision_support');
    expect(decisionSelection.lifecycleStage).toBe('decision_support');
    expect(decisionSelection.lifecycleMode).toBe('memory_led');
    expect(decisionSelection.memoryBudgetPreset).toBe('decision_support');
  });

  it('selects lifecycle-based memory budgets conservatively in the first week', () => {
    const selection = selectPromptMemoryPayload({
      memoryProfile,
      recentMessages,
      preset: 'day1_compact',
    });

    expect(selection.selectedMemoryProfile?.conversationDigest).toBe('');
    expect(selection.selectedMemoryProfile?.openLoops).toEqual([]);
    expect(selection.selectedMemoryProfile?.lastUserQuestions).toHaveLength(1);
    expect(selection.selectedRecentMessages).toHaveLength(1);
  });

  it('unlocks journey summaries only for later lifecycle budgets with enough memory quality', () => {
    const earlySelection = selectPromptMemoryPayload({
      memoryProfile,
      recentMessages,
      preset: 'day6_pattern_preview',
    });
    const lateSelection = selectPromptMemoryPayload({
      memoryProfile,
      recentMessages,
      preset: 'time_archive',
    });

    expect(earlySelection.selectedMemoryProfile?.journeySummary).toBe('');
    expect(lateSelection.selectedMemoryProfile?.journeySummary).toContain('The longer journey keeps returning');
  });

  it('routes daily insight and mini app modes through the same lifecycle stage', () => {
    const dailySelection = resolveDailyInsightModeSelection({
      lifecycle: { daysSinceFirstReading: 2 },
    });
    const coupleSelection = resolveMiniAppModeSelection({
      lifecycle: { daysSinceFirstReading: 48 },
      miniAppKind: 'couple',
    });
    const dreamSelection = resolveMiniAppModeSelection({
      lifecycle: { daysSinceFirstReading: 220 },
      miniAppKind: 'dream',
    });

    expect(dailySelection.promptMode).toBe('daily_guided_focus');
    expect(dailySelection.memoryBudgetPreset).toBe('daily_guided_compact');
    expect(coupleSelection.promptMode).toBe('couple_pattern_reflection');
    expect(coupleSelection.memoryBudgetPreset).toBe('miniapp_pattern_relationship');
    expect(dreamSelection.promptMode).toBe('dream_archive_resonance');
    expect(dreamSelection.memoryBudgetPreset).toBe('miniapp_archive_symbolic');
  });

  it('keeps the couple mini-app prompt separated from main chat', () => {
    const prompt = buildCouplePrompt({
      language: 'en',
      profile,
      lifecycle: {
        stage: 'pattern_building',
        mode: 'memory_led',
        daysSinceFirstReading: 16,
      },
      memoryProfile,
      miniAppContext: {
        partnerProfile: {
          name: 'Partner',
          relation: 'lover',
          birthDate: { year: 1994, month: 4, day: 8 },
        },
      },
    });

    expect(prompt).toContain('miniAppCouple:couple-2');
    expect(prompt).toContain('Return strict JSON only.');
    expect(prompt).toContain('You are handling the Couple Matching mini app, not the main chat reading.');
    expect(prompt).toContain('Resolved mini app mode: couple_pattern_reflection.');
    expect(prompt).toContain('Memory budget preset: miniapp_pattern_relationship.');
    expect(prompt).not.toContain('Short-term dialogue memory');
  });

  it('keeps the dream mini-app prompt separated from main chat', () => {
    const prompt = buildDreamPrompt({
      language: 'en',
      lifecycle: {
        stage: 'time_archive',
        mode: 'memory_led',
        daysSinceFirstReading: 410,
      },
      memoryProfile,
      miniAppContext: {
        dreamText: 'I dreamed of climbing a bright mountain and finding clear water.',
      },
    });

    expect(prompt).toContain('miniAppDream:dream-3');
    expect(prompt).toContain('Interpret the dream in a mystical but intimate tone.');
    expect(prompt).toContain('Structure rule: write 2 or 3 compact sentences.');
    expect(prompt).toContain('Resolved mini app mode: dream_archive_resonance.');
    expect(prompt).toContain('Memory budget preset: miniapp_archive_symbolic.');
    expect(prompt).not.toContain('Verified saju summary');
  });

  it('keeps continuation and opener rules consistent across languages', () => {
    const koPrompt = buildChatPrompt({
      language: 'ko',
      message: '연애 흐름을 보고 싶어요.',
      profile,
      saju,
      isInitialAnalysis: true,
      promptMode: 'chat',
      memoryProfile,
      recentMessages,
    });

    const enPrompt = buildChatPrompt({
      language: 'en',
      message: 'I want to understand my love flow.',
      profile,
      saju,
      isInitialAnalysis: true,
      promptMode: 'chat',
      memoryProfile,
      recentMessages,
    });

    const jaPrompt = buildChatPrompt({
      language: 'ja',
      message: '恋愛の流れを知りたいです。',
      profile,
      saju,
      isInitialAnalysis: true,
      promptMode: 'chat',
      memoryProfile,
      recentMessages,
    });

    expect(koPrompt).toContain(`"${CONTINUATION_OPENINGS.ko}"`);
    expect(enPrompt).toContain(`"${CONTINUATION_OPENINGS.en}"`);
    expect(jaPrompt).toContain(`"${CONTINUATION_OPENINGS.ja}"`);
    expect(koPrompt).not.toMatch(BROKEN_TEXT_PATTERN);
    expect(enPrompt).not.toMatch(BROKEN_TEXT_PATTERN);
    expect(jaPrompt).not.toMatch(BROKEN_TEXT_PATTERN);
  });

  it('keeps local fallback outputs readable and long enough to be useful', () => {
    const koFallback = buildLocalChatReply('ko', {
      message: '연애와 일이 모두 흔들리는 것 같아요.',
      saju,
      isInitialAnalysis: true,
      containsBrokenCharacters: (value) => BROKEN_TEXT_PATTERN.test(value),
    }).reply;

    const enFallback = buildLocalChatReply('en', {
      message: 'Both love and work feel unstable.',
      saju,
      isInitialAnalysis: false,
      containsBrokenCharacters: (value) => BROKEN_TEXT_PATTERN.test(value),
    }).reply;

    const jaFallback = buildLocalChatReply('ja', {
      message: '恋愛も仕事も不安定です。',
      saju,
      isInitialAnalysis: false,
      containsBrokenCharacters: (value) => BROKEN_TEXT_PATTERN.test(value),
    }).reply;

    expect(koFallback.length).toBeGreaterThan(120);
    expect(enFallback.length).toBeGreaterThan(120);
    expect(jaFallback.length).toBeGreaterThan(80);
    expect(koFallback).not.toMatch(BROKEN_TEXT_PATTERN);
    expect(enFallback).not.toMatch(BROKEN_TEXT_PATTERN);
    expect(jaFallback).not.toMatch(BROKEN_TEXT_PATTERN);
  });

  it('keeps daily fallback outputs valid across languages', () => {
    for (const language of ['ko', 'en', 'ja'] as const) {
      const payload = buildFallbackDailyInsights(language);
      expect(payload.luckyItems).toHaveLength(3);
      expect(payload.sajuTip).not.toMatch(BROKEN_TEXT_PATTERN);
      expect(payload.elementTip).not.toMatch(BROKEN_TEXT_PATTERN);
      expect(payload.energyTip).not.toMatch(BROKEN_TEXT_PATTERN);
      expect(payload.cycleTip).not.toMatch(BROKEN_TEXT_PATTERN);
    }
  });
});
