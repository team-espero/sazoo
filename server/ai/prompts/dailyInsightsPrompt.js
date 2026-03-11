import { buildProfileSummary, buildSajuSummary } from './contextFormatting.js';
import { buildBaseSystemLayer, buildDailyInsightsLayer, buildPersonaToneLayer } from './layers.js';
import { PROMPT_LAYER_VERSIONS, PROMPT_VERSION } from './promptVersion.js';
import { SAZOO_TONE_GUIDE, languageLabels } from './shared.js';

export function buildDailyInsightsPrompt({ language, date, profile, saju }) {
  const selectedLanguage = languageLabels[language] || languageLabels.ko;

  return [
    `Prompt version: ${PROMPT_VERSION}`,
    `Prompt layers: baseSystem:${PROMPT_LAYER_VERSIONS.baseSystem}, personaTone:${PROMPT_LAYER_VERSIONS.personaTone}, dailyInsights:${PROMPT_LAYER_VERSIONS.dailyInsights}`,
    SAZOO_TONE_GUIDE,
    buildBaseSystemLayer(),
    buildPersonaToneLayer(),
    buildDailyInsightsLayer(),
    `Language: ${selectedLanguage}.`,
    `Date: ${date || new Date().toISOString().slice(0, 10)}`,
    `User profile summary:\n${buildProfileSummary(profile)}`,
    `Verified saju summary:\n${buildSajuSummary(saju)}`,
    '{',
    '  "luckyItems": [{"emoji":"string","name":"string","type":"string"}],',
    '  "sajuTip": "string",',
    '  "elementTip": "string",',
    '  "energyTip": "string",',
    '  "cycleTip": "string"',
    '}',
  ].join('\n');
}
