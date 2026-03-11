import { buildBaseSystemLayer, buildPersonaToneLayer } from '../layers.js';
import { PROMPT_LAYER_VERSIONS, PROMPT_VERSION } from '../promptVersion.js';
import { SAZOO_TONE_GUIDE, languageLabels } from '../shared.js';

export function buildDreamPrompt({ language, miniAppContext }) {
  const selectedLanguage = languageLabels[language] || languageLabels.ko;
  const dreamText = String(miniAppContext?.dreamText || '').trim();

  return [
    `Prompt version: ${PROMPT_VERSION}`,
    `Prompt layers: baseSystem:${PROMPT_LAYER_VERSIONS.baseSystem}, personaTone:${PROMPT_LAYER_VERSIONS.personaTone}, miniAppDream:dream-2`,
    SAZOO_TONE_GUIDE,
    buildBaseSystemLayer(),
    buildPersonaToneLayer(),
    'You are handling the Dream Reading mini app, not the main chat reading.',
    `Language: ${selectedLanguage}.`,
    'Interpret the dream in a mystical but intimate tone.',
    'Return plain text only.',
    'Structure rule: write 2 or 3 compact sentences.',
    'Length rule: aim for roughly 110-200 characters in the selected language, and never answer with only one short sentence.',
    'Content rule: explain the emotional meaning first, then give one calm next-step clue.',
    `Dream text: ${dreamText}`,
  ].join('\n');
}
