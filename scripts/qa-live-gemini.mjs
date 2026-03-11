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

const memoryProfile = {
  version: 'phase4.v2',
  knowledgeLevel: 'newbie',
  preferredTone: 'mysterious_intimate',
  primaryConcerns: ['love', 'career'],
  recurringTopics: ['love', 'timing', 'career'],
  relationshipContext: { relation: 'me', focus: 'love' },
  recentSummary: 'The user wants a clear reading about love and career timing.',
  conversationDigest: 'Earlier conversation themes: love, career, timing. The older thread kept circling back to whether to move first or stay steady.',
  openLoops: ['Should I focus on love first, or should I stabilize work first?'],
  lastAssistantGuidance: 'Move one step at a time instead of trying to force both paths at once.',
  lastUserQuestions: ['Should I focus on love first, or should I stabilize work first?'],
};

const recentMessages = [
  { role: 'assistant', text: 'Let us read this one layer at a time.' },
  { role: 'user', text: 'Love and work both feel unstable right now.' },
];

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

const results = [];

results.push(await measure('chat_ko_initial', async () => {
  const response = await provider.chat({
    message: '\uC5F0\uC560\uC640 \uC77C\uC774 \uD55C\uAED8 \uD754\uB4E4\uB9AC\uB294\uB370, \uC9C0\uAE08 \uC5B4\uB5A4 \uD750\uB984\uBD80\uD130 \uC7A1\uC73C\uBA74 \uC88B\uC744\uAE4C\uC694?',
    language: 'ko',
    profile,
    saju,
    isInitialAnalysis: true,
    memoryProfile,
    recentMessages,
    promptMode: 'chat',
  });

  const text = String(response.reply || '').trim();
  assertCleanText(text, 'chat_ko_initial');
  assert(text.length >= (strictMode ? 180 : 120), 'chat_ko_initial is too short.');
  assert(text.length <= (strictMode ? 900 : 1200), 'chat_ko_initial is too long.');
  assert(!GENERIC_GREETING_PATTERN.test(text), 'chat_ko_initial started with a generic greeting.');

  return {
    ok: true,
    length: text.length,
    preview: text.slice(0, 160),
  };
}));

results.push(await measure('chat_en_deep', async () => {
  const response = await provider.chat({
    message: 'I am torn between changing jobs and staying where I am. Which flow looks steadier first?',
    language: 'en',
    profile,
    saju,
    isInitialAnalysis: false,
    memoryProfile,
    recentMessages,
    promptMode: 'chat',
  });

  const text = String(response.reply || '').trim();
  assertCleanText(text, 'chat_en_deep');
  assert(text.length >= (strictMode ? 260 : 180), 'chat_en_deep is too short.');
  assert(text.length <= (strictMode ? 950 : 1500), 'chat_en_deep is too long.');
  assert(!GENERIC_GREETING_PATTERN.test(text), 'chat_en_deep started with a generic greeting.');

  return {
    ok: true,
    length: text.length,
    preview: text.slice(0, 160),
  };
}));

results.push(await measure('miniapp_couple', async () => {
  const response = await provider.chat({
    message: 'Kim Hyejin x Lee Minseo compatibility',
    language: 'en',
    profile,
    promptMode: 'miniapp_couple',
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
  assert(typeof parsed.score === 'number', 'miniapp_couple score is missing.');
  assert(parsed.score >= 0 && parsed.score <= 100, 'miniapp_couple score is out of range.');
  assert(typeof parsed.summary === 'string' && parsed.summary.trim().length >= (strictMode ? 24 : 12), 'miniapp_couple summary is too short.');
  assert(typeof parsed.detail === 'string' && parsed.detail.trim().length >= (strictMode ? 80 : 40), 'miniapp_couple detail is too short.');
  assert(!BROKEN_TEXT_PATTERN.test(parsed.summary), 'miniapp_couple summary contains broken text.');
  assert(!BROKEN_TEXT_PATTERN.test(parsed.detail), 'miniapp_couple detail contains broken text.');

  return {
    ok: true,
    score: parsed.score,
    preview: parsed.summary,
  };
}));

results.push(await measure('miniapp_dream', async () => {
  const response = await provider.chat({
    message: 'I dreamed of walking through a moonlit forest and finding calm water.',
    language: 'en',
    promptMode: 'miniapp_dream',
    miniAppContext: {
      app: 'dream',
      dreamText: 'I dreamed of walking through a moonlit forest and finding calm water.',
    },
  });

  const text = String(response.reply || '').trim();
  assertCleanText(text, 'miniapp_dream');
  assert(text.length >= (strictMode ? 80 : 40), 'miniapp_dream is too short.');
  assert(text.length <= (strictMode ? 220 : 260), 'miniapp_dream is too long.');
  assert(!GENERIC_GREETING_PATTERN.test(text), 'miniapp_dream started with a generic greeting.');

  return {
    ok: true,
    length: text.length,
    preview: text.slice(0, 160),
  };
}));

results.push(await measure('daily_insights', async () => {
  const response = await provider.dailyInsights({
    language: 'ko',
    date: '2026-03-11',
    profile,
    saju,
  });

  assert(Array.isArray(response.luckyItems) && response.luckyItems.length >= 3, 'daily_insights lucky items are incomplete.');
  for (const [index, item] of response.luckyItems.entries()) {
    assert(typeof item?.name === 'string' && item.name.trim().length >= 1, `daily_insights lucky item ${index + 1} is missing a name.`);
    assert(typeof item?.type === 'string' && item.type.trim().length >= 1, `daily_insights lucky item ${index + 1} is missing a type.`);
  }
  for (const field of ['sajuTip', 'elementTip', 'energyTip', 'cycleTip']) {
    const text = String(response[field] || '').trim();
    assertCleanText(text, `daily_insights.${field}`);
    assert(text.length >= (strictMode ? 35 : 20), `daily_insights.${field} is too short.`);
    assert(text.length <= 280, `daily_insights.${field} is too long.`);
  }
  assert(
    response.source === 'model' || response.source === 'fallback',
    'daily_insights.source is missing or invalid.',
  );

  return {
    ok: true,
    luckyItems: response.luckyItems.length,
    source: response.source,
    preview: response.sajuTip.slice(0, 160),
  };
}));

assertDuration(results[0].durationMs, 3500, 2500, 'chat_ko_initial');
assertDuration(results[1].durationMs, 3500, 2500, 'chat_en_deep');
assertDuration(results[2].durationMs, 3500, 2500, 'miniapp_couple');
assertDuration(results[3].durationMs, 2800, 1800, 'miniapp_dream');
assertDuration(results[4].durationMs, 3000, 2000, 'daily_insights');

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
