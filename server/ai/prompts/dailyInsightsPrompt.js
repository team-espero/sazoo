import { buildMemoryContextBlock } from './contextSelection.js';
import { buildProfileSummary, buildSajuSummary } from './contextFormatting.js';
import { buildBaseSystemLayer, buildDailyInsightsLayer, buildInterpretationPolicyLayer, buildPersonaToneLayer } from './layers.js';
import { buildDailyInsightModeLayer, resolveDailyInsightModeSelection } from './lifecycleModeSelection.js';
import { buildMemoryBudgetLayer, selectPromptMemoryPayload } from './memoryBudgetSelection.js';
import { PROMPT_LAYER_VERSIONS, PROMPT_VERSION } from './promptVersion.js';
import { SAZOO_TONE_GUIDE, languageLabels } from './shared.js';

export function buildDailyInsightsPrompt({ language, date, profile, saju, lifecycle, memoryProfile }) {
  const selectedLanguage = languageLabels[language] || languageLabels.ko;
  const modeSelection = resolveDailyInsightModeSelection({ lifecycle });
  const memorySelection = selectPromptMemoryPayload({
    memoryProfile,
    preset: modeSelection.memoryBudgetPreset,
  });

  return [
    `Prompt version: ${PROMPT_VERSION}`,
    `Prompt layers: baseSystem:${PROMPT_LAYER_VERSIONS.baseSystem}, personaTone:${PROMPT_LAYER_VERSIONS.personaTone}, interpretationPolicy:${PROMPT_LAYER_VERSIONS.interpretationPolicy}, dailyInsightMode:${PROMPT_LAYER_VERSIONS.dailyInsightMode}, dailyInsights:${PROMPT_LAYER_VERSIONS.dailyInsights}, memoryContext:${PROMPT_LAYER_VERSIONS.memoryContext}`,
    SAZOO_TONE_GUIDE,
    buildBaseSystemLayer(),
    buildPersonaToneLayer(),
    buildInterpretationPolicyLayer({ compact: true, channel: 'daily_insights' }),
    buildDailyInsightModeLayer(modeSelection),
    buildDailyInsightsLayer(),
    `Language: ${selectedLanguage}.`,
    `Date: ${date || new Date().toISOString().slice(0, 10)}`,
    `User profile summary:\n${buildProfileSummary(profile)}`,
    `Verified saju summary:\n${buildSajuSummary(saju)}`,
    buildMemoryBudgetLayer({
      preset: modeSelection.memoryBudgetPreset,
      budget: memorySelection.budget,
    }),
    buildMemoryContextBlock(memorySelection.selectedMemoryProfile, 'daily insight focus'),
    '{',
    '  "luckyItems": [{"emoji":"string","name":"string","type":"string"}],',
    '  "sajuTip": "string",',
    '  "elementTip": "string",',
    '  "energyTip": "string",',
    '  "cycleTip": "string"',
    '}',
  ].join('\n');
}
