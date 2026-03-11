import { buildMemoryContextBlock, buildRecentDialogueContext } from './contextSelection.js';
import { buildProfileSummary, buildSajuSummary, hasCompleteSaju } from './contextFormatting.js';
import {
  buildBaseSystemLayer,
  buildDeepReadingLayer,
  buildFirstReadingLayer,
  buildPersonaToneLayer,
} from './layers.js';
import { PROMPT_LAYER_VERSIONS, PROMPT_VERSION } from './promptVersion.js';
import { CONTINUATION_OPENINGS, SAZOO_TONE_GUIDE, languageLabels } from './shared.js';

export function buildChatPrompt({
  language,
  message,
  profile,
  saju,
  isInitialAnalysis,
  memoryProfile,
  recentMessages,
}) {
  const selectedLanguage = languageLabels[language] || languageLabels.ko;
  const continuationOpening = CONTINUATION_OPENINGS[language] || CONTINUATION_OPENINGS.ko;

  return [
    `Prompt version: ${PROMPT_VERSION}`,
    `Prompt layers: ${Object.entries(PROMPT_LAYER_VERSIONS).map(([key, value]) => `${key}:${value}`).join(', ')}`,
    SAZOO_TONE_GUIDE,
    buildBaseSystemLayer(),
    buildPersonaToneLayer(),
    isInitialAnalysis
      ? buildFirstReadingLayer({ continuationOpening })
      : buildDeepReadingLayer({ continuationOpening }),
    `Language: ${selectedLanguage}.`,
    hasCompleteSaju(saju)
      ? 'The supplied four pillars are complete. Do not say the chart is incomplete.'
      : 'If the supplied chart is partial, acknowledge that gently without pretending it is exact.',
    `User profile summary:\n${buildProfileSummary(profile)}`,
    `Verified saju summary:\n${buildSajuSummary(saju)}`,
    buildMemoryContextBlock(memoryProfile, message),
    buildRecentDialogueContext(recentMessages),
    `User message: ${message}`,
  ].join('\n');
}
