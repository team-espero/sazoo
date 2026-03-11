import { describe, expect, it } from 'vitest';
import { buildChatPrompt } from './chatPrompt.js';
import { buildDailyInsightsPrompt } from './dailyInsightsPrompt.js';
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
  version: 'phase4.v2',
  knowledgeLevel: 'newbie',
  preferredTone: 'mysterious_intimate',
  primaryConcerns: ['love', 'career'],
  recurringTopics: ['love', 'career', 'timing'],
  relationshipContext: { relation: 'me', focus: 'love' },
  recentSummary: 'The user keeps returning to love and career. Most recent question: priorities first.',
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
      memoryProfile,
      recentMessages,
    });

    expect(prompt).toContain('Prompt version: 2026-03-11.phase4.v2');
    expect(prompt).toContain('Prompt layers:');
    expect(prompt).toContain('Language: Korean.');
    expect(prompt).toContain(`Opening rule: begin with "${CONTINUATION_OPENINGS.ko}"`);
    expect(prompt).toContain('Verified saju summary:');
    expect(prompt).toContain('Memory version: phase4.v2');
    expect(prompt).toContain('Short-term dialogue memory:');
    expect(prompt).toContain('User message: 연애와 일이 모두 흔들리는 것 같아요.');
    expect(prompt).not.toMatch(BROKEN_TEXT_PATTERN);
  });

  it('keeps the daily insights prompt contract stable', () => {
    const prompt = buildDailyInsightsPrompt({
      language: 'ko',
      date: '2026-03-11',
      profile,
      saju,
    });

    expect(prompt).toContain('Prompt version: 2026-03-11.phase4.v2');
    expect(prompt).toContain('Prompt layers: baseSystem:base-1, personaTone:persona-1, dailyInsights:daily-insights-1');
    expect(prompt).toContain('"luckyItems": [{"emoji":"string","name":"string","type":"string"}]');
    expect(prompt).not.toMatch(BROKEN_TEXT_PATTERN);
  });

  it('keeps the couple mini-app prompt separated from main chat', () => {
    const prompt = buildCouplePrompt({
      language: 'en',
      profile,
      miniAppContext: {
        partnerProfile: {
          name: 'Partner',
          relation: 'lover',
          birthDate: { year: 1994, month: 4, day: 8 },
        },
      },
    });

    expect(prompt).toContain('miniAppCouple:couple-1');
    expect(prompt).toContain('Return strict JSON only.');
    expect(prompt).toContain('You are handling the Couple Matching mini app, not the main chat reading.');
    expect(prompt).not.toContain('Short-term dialogue memory');
  });

  it('keeps the dream mini-app prompt separated from main chat', () => {
    const prompt = buildDreamPrompt({
      language: 'en',
      miniAppContext: {
        dreamText: 'I dreamed of climbing a bright mountain and finding clear water.',
      },
    });

    expect(prompt).toContain('miniAppDream:dream-2');
    expect(prompt).toContain('Interpret the dream in a mystical but intimate tone.');
    expect(prompt).toContain('Structure rule: write 2 or 3 compact sentences.');
    expect(prompt).not.toContain('Verified saju summary');
  });

  it('keeps continuation and opener rules consistent across languages', () => {
    const koPrompt = buildChatPrompt({
      language: 'ko',
      message: '연애 흐름을 보고 싶어요.',
      profile,
      saju,
      isInitialAnalysis: true,
      memoryProfile,
      recentMessages,
    });

    const enPrompt = buildChatPrompt({
      language: 'en',
      message: 'I want to understand my love flow.',
      profile,
      saju,
      isInitialAnalysis: true,
      memoryProfile,
      recentMessages,
    });

    const jaPrompt = buildChatPrompt({
      language: 'ja',
      message: '恋愛の流れを知りたいです。',
      profile,
      saju,
      isInitialAnalysis: true,
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
