import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { createGeminiProvider } from '../server/ai/geminiProvider.js';
import { getServerEnv } from '../server/env.js';

const strictMode = process.argv.includes('--strict') || process.env.CI === 'true';
const outputPath = path.resolve(strictMode ? 'qa_live_gemini_ci_result.json' : 'qa_live_gemini_result.json');
const env = getServerEnv();

if (!env.geminiApiKey) {
  throw new Error('GEMINI_API_KEY is required to run live Gemini QA.');
}

const BROKEN_TEXT_PATTERN = /\uFFFD|\?\?\?|\bundefined\b/i;
const CODE_FENCE_PATTERN = /```|^\s*[-*]\s/m;
const GENERIC_GREETING_PATTERN = /^(hello|hi|hey|annyeong|\uC548\uB155|\uC548\uB155\uD558\uC138\uC694|konnichiwa|\u3053\u3093\u306B\u3061\u306F)[,.!\s]*/iu;

const profile = {
  id: 'me',
  name: 'Kim Hyejin',
  gender: 'female',
  knowledgeLevel: 'newbie',
  birthDate: { year: 1994, month: 4, day: 5, hour: 11, minute: 30, ampm: 'AM' },
  calendarType: 'solar',
  isTimeUnknown: false,
  relation: 'me',
  memo: '',
};

const saju = {
  year: { stem: { kor: '\uAC11', element: '\uBAA9' }, branch: { kor: '\uC220', element: '\uD1A0' } },
  month: { stem: { kor: '\uBB34', element: '\uD1A0' }, branch: { kor: '\uC9C4', element: '\uD1A0' } },
  day: { stem: { kor: '\uC784', element: '\uC218' }, branch: { kor: '\uC790', element: '\uC218' } },
  hour: { stem: { kor: '\uC744', element: '\uBAA9' }, branch: { kor: '\uC0AC', element: '\uD654' } },
};

const provider = createGeminiProvider({
  apiKey: env.geminiApiKey,
  chatModel: env.geminiChatModel,
  insightsModel: env.geminiInsightsModel,
});

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertCleanText = (text, label) => {
  assert(typeof text === 'string' && text.trim().length > 0, `${label} is empty.`);
  assert(!BROKEN_TEXT_PATTERN.test(text), `${label} contains broken text.`);
  assert(!CODE_FENCE_PATTERN.test(text), `${label} contains markdown formatting.`);
};

const assertDuration = (durationMs, relaxed, strict, label) => {
  const threshold = strictMode ? strict : relaxed;
  assert(durationMs <= threshold, `${label} exceeded ${threshold}ms (${durationMs}ms).`);
};

const measure = async (name, callback) => {
  const startedAt = Date.now();
  const result = await callback();
  return {
    name,
    durationMs: Date.now() - startedAt,
    ...result,
  };
};

const buildLifecycle = (stage, daysSinceFirstReading) => ({
  stage,
  mode: stage.startsWith('day') ? 'product_led' : 'memory_led',
  daysSinceOnboarding: daysSinceFirstReading,
  daysSinceFirstReading,
});

const buildMemoryProfile = ({
  quality,
  recentSummary,
  conversationDigest,
  journeySummary,
  openLoops,
  lastAssistantGuidance,
  lastUserQuestions,
  primaryConcerns = ['love', 'career'],
  recurringTopics = ['love', 'career', 'timing'],
} = {}) => ({
  version: 'phase4.v3',
  knowledgeLevel: quality === 'rich' ? 'intermediate' : 'newbie',
  preferredTone: 'mysterious_intimate',
  memoryQuality: quality,
  primaryConcerns,
  recurringTopics,
  relationshipContext: { relation: 'me', focus: primaryConcerns[0] || 'self' },
  recentSummary,
  conversationDigest,
  journeySummary,
  openLoops,
  lastAssistantGuidance,
  lastUserQuestions,
});

const memoryProfiles = {
  guided: buildMemoryProfile({
    quality: 'emerging',
    recentSummary: 'The user is in the first week and responds well to one clear takeaway at a time.',
    conversationDigest: '',
    journeySummary: '',
    openLoops: ['What should I steady first today?'],
    lastAssistantGuidance: '',
    lastUserQuestions: ['What should I steady first today?'],
    primaryConcerns: ['self', 'timing'],
    recurringTopics: ['self', 'timing'],
  }),
  patterned: buildMemoryProfile({
    quality: 'patterned',
    recentSummary: 'The user keeps revisiting love, career, and timing when they feel split between emotion and structure.',
    conversationDigest: 'Earlier conversation themes: love, career, timing. The user often asks whether to move first or wait for stability.',
    journeySummary: 'The longer journey keeps returning to love, career, and timing. The user often reopens the reading when they are choosing between emotional courage and practical stability.',
    openLoops: ['Should I move first, or should I wait until work feels steadier?'],
    lastAssistantGuidance: 'Choose the smaller stabilizing move first, then widen the path once your footing is steady.',
    lastUserQuestions: ['Should I move first, or should I wait until work feels steadier?'],
  }),
  rich: buildMemoryProfile({
    quality: 'rich',
    recentSummary: 'The user wants readings that connect love, work, timing, and emotional pacing without sounding fatalistic.',
    conversationDigest: 'Earlier conversation themes: love, career, timing. The older thread kept circling back to whether to move first or stay steady.',
    journeySummary: 'The longer journey keeps returning to love, career, and timing. The user often reopens the reading when they are choosing between emotional courage and practical stability. Guidance lands best when it stays calm, specific, and action-led. The reading should treat this user like someone whose concerns evolve in layers rather than as isolated one-off questions.',
    openLoops: ['Should I focus on love first, or should I stabilize work first?'],
    lastAssistantGuidance: 'Move one step at a time instead of trying to force both paths at once.',
    lastUserQuestions: ['Should I focus on love first, or should I stabilize work first?'],
  }),
};

const recentMessages = [
  { role: 'assistant', text: 'Let us read this one layer at a time.' },
  { role: 'user', text: 'Love and work both feel unstable right now.' },
  { role: 'assistant', text: 'Then we should first see which current is moving faster today.' },
];

const results = [];

async function runChatCase({
  name,
  language,
  message,
  lifecycle,
  memoryProfile,
  minLength,
  maxLength,
  isInitialAnalysis = false,
  relaxedDuration = 3500,
  strictDuration = 2500,
}) {
  const response = await provider.chat({
    message,
    language,
    profile,
    saju,
    isInitialAnalysis,
    memoryProfile,
    recentMessages,
    promptMode: 'chat',
    lifecycle,
  });

  const text = String(response.reply || '').trim();
  assertCleanText(text, name);
  assert(text.length >= minLength, `${name} is too short.`);
  assert(text.length <= maxLength, `${name} is too long.`);
  assert(!GENERIC_GREETING_PATTERN.test(text), `${name} started with a generic greeting.`);

  return {
    relaxedDuration,
    strictDuration,
    payload: {
      ok: true,
      channel: 'chat',
      stage: lifecycle.stage,
      memoryQuality: memoryProfile.memoryQuality,
      length: text.length,
      preview: text.slice(0, 180),
    },
  };
}

async function runDailyCase({
  name,
  lifecycle,
  memoryProfile,
  relaxedDuration = 3000,
  strictDuration = 2200,
}) {
  const response = await provider.dailyInsights({
    language: 'ko',
    date: '2026-03-12',
    profile,
    saju,
    lifecycle,
    memoryProfile,
  });

  assert(Array.isArray(response.luckyItems) && response.luckyItems.length >= 3, `${name} lucky items are incomplete.`);
  for (const field of ['sajuTip', 'elementTip', 'energyTip', 'cycleTip']) {
    const text = String(response[field] || '').trim();
    assertCleanText(text, `${name}.${field}`);
    assert(text.length >= (strictMode ? 35 : 20), `${name}.${field} is too short.`);
    assert(text.length <= 280, `${name}.${field} is too long.`);
  }
  assert(
    response.source === 'model' || response.source === 'fallback',
    `${name}.source is missing or invalid.`,
  );

  return {
    relaxedDuration,
    strictDuration,
    payload: {
      ok: true,
      channel: 'daily_insights',
      stage: lifecycle.stage,
      memoryQuality: memoryProfile.memoryQuality,
      source: response.source,
      luckyItems: response.luckyItems.length,
      preview: response.sajuTip.slice(0, 160),
    },
  };
}

async function runCoupleCase({
  name,
  lifecycle,
  memoryProfile,
  relaxedDuration = 3500,
  strictDuration = 2500,
}) {
  const response = await provider.chat({
    message: 'Kim Hyejin x Lee Minseo compatibility',
    language: 'en',
    profile,
    promptMode: 'miniapp_couple',
    lifecycle,
    memoryProfile,
    miniAppContext: {
      app: 'couple',
      partnerProfile: {
        name: 'Lee Minseo',
        relation: 'lover',
        birthDate: { year: 1993, month: 10, day: 18 },
      },
    },
  });

  const parsed = JSON.parse(response.reply);
  assert(typeof parsed.score === 'number', `${name} score is missing.`);
  assert(parsed.score >= 0 && parsed.score <= 100, `${name} score is out of range.`);
  assert(typeof parsed.summary === 'string' && parsed.summary.trim().length >= (strictMode ? 24 : 12), `${name} summary is too short.`);
  assert(typeof parsed.detail === 'string' && parsed.detail.trim().length >= (strictMode ? 90 : 50), `${name} detail is too short.`);
  assert(!BROKEN_TEXT_PATTERN.test(parsed.summary), `${name} summary contains broken text.`);
  assert(!BROKEN_TEXT_PATTERN.test(parsed.detail), `${name} detail contains broken text.`);

  return {
    relaxedDuration,
    strictDuration,
    payload: {
      ok: true,
      channel: 'miniapp_couple',
      stage: lifecycle.stage,
      memoryQuality: memoryProfile.memoryQuality,
      score: parsed.score,
      preview: parsed.summary,
    },
  };
}

async function runDreamCase({
  name,
  lifecycle,
  memoryProfile,
  relaxedDuration = 2800,
  strictDuration = 1800,
}) {
  const response = await provider.chat({
    message: 'I dreamed of walking through a moonlit forest and finding calm water.',
    language: 'en',
    promptMode: 'miniapp_dream',
    lifecycle,
    memoryProfile,
    miniAppContext: {
      app: 'dream',
      dreamText: 'I dreamed of walking through a moonlit forest and finding calm water.',
    },
  });

  const text = String(response.reply || '').trim();
  assertCleanText(text, name);
  assert(text.length >= (strictMode ? 100 : 60), `${name} is too short.`);
  assert(text.length <= 220, `${name} is too long.`);
  assert(!GENERIC_GREETING_PATTERN.test(text), `${name} started with a generic greeting.`);

  return {
    relaxedDuration,
    strictDuration,
    payload: {
      ok: true,
      channel: 'miniapp_dream',
      stage: lifecycle.stage,
      memoryQuality: memoryProfile.memoryQuality,
      length: text.length,
      preview: text.slice(0, 160),
    },
  };
}

const cases = [
  {
    name: 'chat_day1_activation',
    run: () => runChatCase({
      name: 'chat_day1_activation',
      language: 'ko',
      message: '\uC5F0\uC560\uC640 \uC77C\uC774 \uD55C\uAED8 \uD754\uB4E4\uB9AC\uB294\uB370, \uC9C0\uAE08 \uC5B4\uB5A4 \uD750\uB984\uBD80\uD130 \uC7A1\uC73C\uBA74 \uC88B\uC744\uAE4C\uC694?',
      lifecycle: buildLifecycle('day1_activation', 0),
      memoryProfile: memoryProfiles.guided,
      minLength: strictMode ? 180 : 120,
      maxLength: strictMode ? 900 : 1200,
      isInitialAnalysis: true,
    }),
  },
  {
    name: 'chat_day2_reopen',
    run: () => runChatCase({
      name: 'chat_day2_reopen',
      language: 'ko',
      message: '\uC5B4\uC81C \uBCF4\uB2E4 \uC870\uAE08 \uB354 \uBD88\uC548\uD55C\uB370, \uC624\uB298\uC740 \uBB50\uBD80\uD130 \uC815\uB9AC\uD558\uBA74 \uC88B\uC744\uAE4C\uC694?',
      lifecycle: buildLifecycle('day2_reopen', 1),
      memoryProfile: memoryProfiles.guided,
      minLength: strictMode ? 180 : 120,
      maxLength: strictMode ? 900 : 1200,
    }),
  },
  {
    name: 'chat_personal_os',
    run: () => runChatCase({
      name: 'chat_personal_os',
      language: 'en',
      message: 'I keep circling the same love and career choice. What personal rhythm should I trust this time?',
      lifecycle: buildLifecycle('personal_os', 90),
      memoryProfile: memoryProfiles.rich,
      minLength: strictMode ? 260 : 180,
      maxLength: strictMode ? 950 : 1500,
      relaxedDuration: 3800,
      strictDuration: 2800,
    }),
  },
  {
    name: 'daily_guided_focus',
    run: () => runDailyCase({
      name: 'daily_guided_focus',
      lifecycle: buildLifecycle('day4_tone_learning', 3),
      memoryProfile: memoryProfiles.guided,
    }),
  },
  {
    name: 'daily_archive_signal',
    run: () => runDailyCase({
      name: 'daily_archive_signal',
      lifecycle: buildLifecycle('time_archive', 420),
      memoryProfile: memoryProfiles.rich,
    }),
  },
  {
    name: 'miniapp_couple_pattern',
    run: () => runCoupleCase({
      name: 'miniapp_couple_pattern',
      lifecycle: buildLifecycle('pattern_building', 20),
      memoryProfile: memoryProfiles.patterned,
    }),
  },
  {
    name: 'miniapp_dream_archive',
    run: () => runDreamCase({
      name: 'miniapp_dream_archive',
      lifecycle: buildLifecycle('relationship_archive', 210),
      memoryProfile: memoryProfiles.rich,
    }),
  },
];

for (const testCase of cases) {
  let durationConfig = { relaxedDuration: 3000, strictDuration: 2200 };
  const measured = await measure(testCase.name, async () => {
    const result = await testCase.run();
    durationConfig = {
      relaxedDuration: result.relaxedDuration,
      strictDuration: result.strictDuration,
    };
    return result.payload;
  });
  assertDuration(measured.durationMs, durationConfig.relaxedDuration, durationConfig.strictDuration, measured.name);
  results.push(measured);
}

const summary = {
  generatedAt: new Date().toISOString(),
  mode: strictMode ? 'strict' : 'default',
  apiBase: 'direct_gemini_provider',
  chatModel: env.geminiChatModel,
  insightsModel: env.geminiInsightsModel,
  passed: results.every((result) => result.ok),
  results,
};

writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(summary, null, 2));
