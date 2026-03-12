import { buildMemoryContextBlock, buildRecentDialogueContext } from './contextSelection.js';
import { buildProfileSummary, buildSajuSummary, hasCompleteSaju } from './contextFormatting.js';
import {
  buildBaseSystemLayer,
  buildDeepReadingLayer,
  buildFirstReadingLayer,
  buildInterpretationPolicyLayer,
  buildPersonaToneLayer,
} from './layers.js';
import { buildPromptModeLayer, resolvePromptModeSelection } from './lifecycleModeSelection.js';
import { buildMemoryBudgetLayer, selectPromptMemoryPayload } from './memoryBudgetSelection.js';
import { PROMPT_LAYER_VERSIONS, PROMPT_VERSION } from './promptVersion.js';
import { CONTINUATION_OPENINGS, SAZOO_TONE_GUIDE, languageLabels } from './shared.js';

export function buildChatPrompt({
  language,
  message,
  profile,
  saju,
  isInitialAnalysis,
  promptMode,
  lifecycle,
  memoryProfile,
  recentMessages,
}) {
  const selectedLanguage = languageLabels[language] || languageLabels.ko;
  const continuationOpening = CONTINUATION_OPENINGS[language] || CONTINUATION_OPENINGS.ko;
  const promptModeSelection = resolvePromptModeSelection({
    requestedPromptMode: promptMode,
    lifecycle,
    isInitialAnalysis,
  });
  const memorySelection = selectPromptMemoryPayload({
    memoryProfile,
    recentMessages,
    preset: promptModeSelection.memoryBudgetPreset,
  });

  return [
    `Prompt version: ${PROMPT_VERSION}`,
    `Prompt layers: ${Object.entries(PROMPT_LAYER_VERSIONS).map(([key, value]) => `${key}:${value}`).join(', ')}`,
    SAZOO_TONE_GUIDE,
    buildBaseSystemLayer(),
    buildPersonaToneLayer(),
    buildInterpretationPolicyLayer(),
    buildPromptModeLayer(promptModeSelection),
    isInitialAnalysis
      ? buildFirstReadingLayer({ continuationOpening })
      : buildDeepReadingLayer({ continuationOpening }),
    `Language: ${selectedLanguage}.`,
    hasCompleteSaju(saju)
      ? 'The supplied four pillars are complete. Do not say the chart is incomplete.'
      : 'If the supplied chart is partial, acknowledge that gently without pretending it is exact.',
    `User profile summary:\n${buildProfileSummary(profile)}`,
    `Verified saju summary:\n${buildSajuSummary(saju)}`,
    buildMemoryBudgetLayer({
      preset: promptModeSelection.memoryBudgetPreset,
      budget: memorySelection.budget,
    }),
    buildMemoryContextBlock(memorySelection.selectedMemoryProfile, message),
    buildRecentDialogueContext(memorySelection.selectedRecentMessages),
    `User message: ${message}`,
  ].join('\n');
}
