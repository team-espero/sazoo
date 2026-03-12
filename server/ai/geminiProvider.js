import { GoogleGenAI } from '@google/genai';
import { chatResponseSchema, dailyInsightsResponseSchema } from '../schemas/fortuneSchemas.js';
import { buildChatPrompt } from './prompts/chatPrompt.js';
import { buildDailyInsightsPrompt } from './prompts/dailyInsightsPrompt.js';
import { isMiniAppPromptMode, resolvePromptModeSelection } from './prompts/lifecycleModeSelection.js';
import {
  buildFallbackCoupleReply,
  buildFallbackDailyInsights,
  buildFallbackDreamReply,
  buildLocalChatReply,
} from './prompts/localFallbacks.js';
import { buildCouplePrompt } from './prompts/miniApps/couplePrompt.js';
import { buildDreamPrompt } from './prompts/miniApps/dreamPrompt.js';
import { hasCompleteSaju } from './prompts/contextFormatting.js';
import { CONTINUATION_OPENINGS, CONTINUATION_PATTERNS, GENERIC_OPENERS } from './prompts/shared.js';

const MODEL_DISCOVERY_TTL_MS = 5 * 60 * 1000;
const INITIAL_TIMEOUT_MS = 2200;
const CHAT_TIMEOUT_MS = 12000;
const INSIGHT_TIMEOUT_MS = 1800;

const INITIAL_MODEL_CANDIDATES = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-latest',
];

const CHAT_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-pro',
];

const INSIGHT_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-pro',
];

const BROKEN_TEXT_PATTERN = /\uFFFD|\u5360|\?{2,}|(^|[\s(])\?[\uAC00-\uD7A3A-Za-z(]|[\uAC00-\uD7A3A-Za-z]\?(?=[\uAC00-\uD7A3A-Za-z)])/u;

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeModelName(name) {
  return String(name || '').replace(/^models\//, '').trim();
}

function extractModelText(result) {
  if (!result) return '';
  if (typeof result.text === 'function') {
    return String(result.text() || '').trim();
  }
  return String(result.text || '').trim();
}

function sanitizePlainText(text) {
  return String(text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
}

function extractFirstJsonObject(text) {
  const source = sanitizePlainText(text);
  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');
  if (start < 0 || end <= start) return null;

  try {
    return JSON.parse(source.slice(start, end + 1));
  } catch {
    return null;
  }
}

function containsBrokenCharacters(value) {
  const text = String(value || '').trim();
  if (!text) return false;
  return BROKEN_TEXT_PATTERN.test(text);
}

function collapseWhitespace(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function clampTextLength(text, maxChars) {
  const normalized = collapseWhitespace(text);
  if (normalized.length <= maxChars) {
    return normalized;
  }

  const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [normalized];
  let next = '';

  for (const sentence of sentences) {
    const candidate = `${next ? `${next} ` : ''}${sentence.trim()}`.trim();
    if (candidate.length > maxChars) {
      break;
    }
    next = candidate;
  }

  if (next) {
    return next;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trim()}...`;
}

function stripGenericOpening(text, language) {
  let normalized = collapseWhitespace(text);
  const rules = GENERIC_OPENERS[language] || GENERIC_OPENERS.ko;

  for (const pattern of rules) {
    normalized = normalized.replace(pattern, '').trim();
  }

  return normalized;
}

function startsWithContinuation(text, language) {
  const normalized = collapseWhitespace(text);
  const patterns = CONTINUATION_PATTERNS[language] || CONTINUATION_PATTERNS.ko;
  return patterns.some((pattern) => pattern.test(normalized));
}

function lowercaseFirstLatin(text) {
  if (!text) return text;
  return text.replace(/^[A-Z]/, (match) => match.toLowerCase());
}

function polishChatReply(text, language, { isInitialAnalysis } = {}) {
  let normalized = stripGenericOpening(text, language);
  if (!normalized || containsBrokenCharacters(normalized)) {
    return '';
  }

  if (isInitialAnalysis && !startsWithContinuation(normalized, language)) {
    const opening = CONTINUATION_OPENINGS[language] || CONTINUATION_OPENINGS.ko;
    const continuedText = language === 'en' ? lowercaseFirstLatin(normalized) : normalized;
    normalized = `${opening} ${continuedText}`.trim();
  }

  return normalized;
}

function normalizeDreamReply(text, language, fallbackReply) {
  const normalized = clampTextLength(stripGenericOpening(sanitizePlainText(text), language), 220);
  if (!normalized || containsBrokenCharacters(normalized) || normalized.length < 100) {
    return fallbackReply;
  }

  return normalized;
}

function normalizeChatReply(text, fallbackReply) {
  const fallback = fallbackReply || 'I cannot read the signal right now. Please try again.';
  const parsed = chatResponseSchema.safeParse({ reply: sanitizePlainText(text) || fallback });
  if (!parsed.success) {
    return { reply: fallback };
  }
  return parsed.data;
}

function isGenerateContentModel(model) {
  const name = normalizeModelName(model?.name);
  const actions = Array.isArray(model?.supportedActions) ? model.supportedActions : [];
  const lowerName = name.toLowerCase();

  if (!name || !actions.includes('generateContent')) return false;
  if (!lowerName.includes('gemini')) return false;
  if (lowerName.includes('embedding')) return false;
  if (lowerName.includes('image') && !lowerName.includes('flash-image')) return false;
  if (lowerName.includes('tts')) return false;
  if (lowerName.includes('audio')) return false;
  if (lowerName.includes('robotics')) return false;
  if (lowerName.includes('computer-use')) return false;
  return true;
}

function buildCandidateList(task, requestedModel) {
  const requested = normalizeModelName(requestedModel);

  if (task === 'initial') {
    return unique([...INITIAL_MODEL_CANDIDATES, requested]);
  }

  if (task === 'insights') {
    return unique([...INSIGHT_MODEL_CANDIDATES, requested]);
  }

  return unique([requested, ...CHAT_MODEL_CANDIDATES]);
}

function buildGenerationConfig(task, modelName) {
  const normalized = normalizeModelName(modelName);
  const supportsThinkingBudgetZero = normalized.includes('2.5-flash');
  const config = {
    temperature: task === 'initial' ? 0.55 : 0.4,
    maxOutputTokens: task === 'initial' ? 360 : task === 'insights' ? 280 : 768,
  };

  if (task === 'insights') {
    config.responseMimeType = 'application/json';
  }

  if (supportsThinkingBudgetZero) {
    config.thinkingConfig = { thinkingBudget: 0 };
  }

  return config;
}

function isChatReplyGoodEnough(reply, { isInitialAnalysis, isEarlyGuidedJourney }) {
  const normalized = String(reply || '').trim();
  if (!normalized) return false;
  if (containsBrokenCharacters(normalized)) return false;

  const minChars = isInitialAnalysis || isEarlyGuidedJourney ? 220 : 320;
  return normalized.length >= minChars;
}

function validateDailyInsightsPayload(payload) {
  const parsed = dailyInsightsResponseSchema.safeParse(payload);
  if (!parsed.success) return null;

  const hasBrokenTips = [
    parsed.data.sajuTip,
    parsed.data.elementTip,
    parsed.data.energyTip,
    parsed.data.cycleTip,
    ...parsed.data.luckyItems.flatMap((item) => [item.name, item.type]),
  ].some(containsBrokenCharacters);

  if (hasBrokenTips || parsed.data.luckyItems.length < 3) {
    return null;
  }

  return {
    ...parsed.data,
    source: parsed.data.source || 'model',
  };
}

function validateCouplePayload(text) {
  const parsed = extractFirstJsonObject(text);
  if (!parsed) {
    throw new Error('Couple prompt did not return JSON');
  }

  if (
    typeof parsed.score !== 'number'
    || typeof parsed.summary !== 'string'
    || typeof parsed.detail !== 'string'
  ) {
    throw new Error('Couple prompt payload shape was invalid');
  }
}

function withTimeout(promise, label, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    }),
  ]);
}

export function createGeminiProvider({ apiKey, chatModel, insightsModel }) {
  const normalizedApiKey = String(apiKey || '').trim();

  if (!normalizedApiKey) {
    throw new Error('GEMINI_API_KEY is required to initialize the Gemini provider.');
  }

  const ai = new GoogleGenAI({ apiKey: normalizedApiKey });
  let modelCache = {
    expiresAt: 0,
    available: null,
  };
  let modelDiscoveryPromise = null;

  async function listAvailableModels() {
    const now = Date.now();
    if (modelCache.available && modelCache.expiresAt > now) {
      return modelCache.available;
    }

    if (!modelDiscoveryPromise) {
      modelDiscoveryPromise = (async () => {
        const pager = await ai.models.list({ config: { pageSize: 100 } });
        const models = [];

        for await (const model of pager) {
          if (isGenerateContentModel(model)) {
            models.push(normalizeModelName(model.name));
          }
        }

        const available = new Set(models);
        modelCache = {
          available,
          expiresAt: Date.now() + MODEL_DISCOVERY_TTL_MS,
        };
        modelDiscoveryPromise = null;
        return available;
      })().catch((error) => {
        modelDiscoveryPromise = null;
        throw error;
      });
    }

    return modelDiscoveryPromise;
  }

  async function resolveCandidateModels(task, requestedModel) {
    const preferred = buildCandidateList(task, requestedModel);

    try {
      const available = await listAvailableModels();
      const matched = preferred.filter((modelName) => available.has(modelName));
      if (matched.length > 0) {
        return matched;
      }
    } catch (error) {
      console.warn('[gemini] failed to list models, using static candidates:', error?.message || error);
    }

    return preferred;
  }

  async function generateAcrossModels({ task, prompt, requestedModel, timeoutMs, validateResult }) {
    const resolvedCandidates = await resolveCandidateModels(task, requestedModel);
    const candidates = task === 'initial' || task === 'insights'
      ? resolvedCandidates.slice(0, 1)
      : resolvedCandidates;
    let lastError = null;

    for (const modelName of candidates) {
      try {
        const result = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: prompt }] }],
            config: buildGenerationConfig(task, modelName),
          }),
          `${task} model ${modelName}`,
          timeoutMs,
        );

        const text = extractModelText(result);
        if (typeof validateResult === 'function') {
          validateResult(text, modelName);
        }

        return { result, modelName, text };
      } catch (error) {
        lastError = error;
        console.warn(`[gemini] ${task} model failed: ${modelName}`, error?.message || error);
      }
    }

    throw lastError || new Error(`No Gemini model succeeded for ${task}`);
  }

  return {
    async chat({
      message,
      language,
      profile,
      saju,
      isInitialAnalysis,
      memoryProfile,
      recentMessages,
      promptMode = 'chat',
      lifecycle,
      miniAppContext,
    }) {
      const isMiniAppMode = isMiniAppPromptMode(promptMode);
      const promptModeSelection = isMiniAppMode
        ? null
        : resolvePromptModeSelection({
            requestedPromptMode: promptMode,
            lifecycle,
            isInitialAnalysis,
          });
      const resolvedPromptMode = promptModeSelection?.promptMode || promptMode;
      const isEarlyGuidedJourney = Boolean(promptModeSelection?.isEarlyGuidedJourney);
      const fallback = promptMode === 'miniapp_couple'
        ? buildFallbackCoupleReply(language, profile, miniAppContext)
        : promptMode === 'miniapp_dream'
          ? buildFallbackDreamReply(language)
          : buildLocalChatReply(language, {
              message,
              saju,
              isInitialAnalysis,
              containsBrokenCharacters,
            });
      const prompt = promptMode === 'miniapp_couple'
        ? buildCouplePrompt({ language, profile, miniAppContext, lifecycle, memoryProfile })
        : promptMode === 'miniapp_dream'
          ? buildDreamPrompt({ language, miniAppContext, lifecycle, memoryProfile })
          : buildChatPrompt({
              language,
              message,
              profile,
              saju,
              isInitialAnalysis,
              promptMode: resolvedPromptMode,
              lifecycle,
              memoryProfile,
              recentMessages,
            });
      const isInitialTask = !isMiniAppMode && (isInitialAnalysis || resolvedPromptMode === 'day1_activation');
      const usesGuidedFastPath = !isMiniAppMode && (isInitialTask || isEarlyGuidedJourney);
      const task = usesGuidedFastPath ? 'initial' : 'chat';
      const requestedModel = usesGuidedFastPath ? 'gemini-2.5-flash-lite' : chatModel;
      const timeoutMs = isInitialTask ? INITIAL_TIMEOUT_MS : isEarlyGuidedJourney ? 2600 : CHAT_TIMEOUT_MS;

      try {
        const { text } = await generateAcrossModels({
          task,
          requestedModel,
          prompt,
          timeoutMs,
          validateResult(replyText) {
            if (promptMode === 'miniapp_couple') {
              validateCouplePayload(replyText);
              return;
            }
            if (promptMode === 'miniapp_dream') {
              const normalized = clampTextLength(stripGenericOpening(sanitizePlainText(replyText), language), 220);
              if (!normalized) {
                throw new Error('Dream prompt returned empty text');
              }
              return;
            }
            const polished = polishChatReply(replyText, language, { isInitialAnalysis: isInitialTask }) || fallback.reply;
            const reply = normalizeChatReply(polished, fallback.reply).reply;
            if (!isChatReplyGoodEnough(reply, { isInitialAnalysis: isInitialTask, isEarlyGuidedJourney })) {
              throw new Error('Chat reply did not meet quality threshold');
            }
          },
        });

        if (promptMode === 'miniapp_couple' || promptMode === 'miniapp_dream') {
          const normalizedText = promptMode === 'miniapp_dream'
            ? normalizeDreamReply(text, language, fallback.reply)
            : sanitizePlainText(text);
          return normalizeChatReply(normalizedText, normalizedText || fallback.reply);
        }

        const polished = polishChatReply(text, language, { isInitialAnalysis: isInitialTask }) || fallback.reply;
        return normalizeChatReply(polished, fallback.reply);
      } catch {
        return fallback;
      }
    },

    async dailyInsights({ language, date, profile, saju, lifecycle, memoryProfile }) {
      const fallback = {
        ...buildFallbackDailyInsights(language),
        source: 'fallback',
      };
      const prompt = buildDailyInsightsPrompt({
        language,
        date,
        profile,
        saju,
        lifecycle,
        memoryProfile,
      });

      try {
        const { text } = await generateAcrossModels({
          task: 'insights',
          requestedModel: insightsModel,
          prompt,
          timeoutMs: INSIGHT_TIMEOUT_MS,
        });

        const parsed = validateDailyInsightsPayload(extractFirstJsonObject(text));
        return parsed || fallback;
      } catch {
        return fallback;
      }
    },
  };
}
