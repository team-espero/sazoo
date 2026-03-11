import { buildBaseSystemLayer, buildPersonaToneLayer } from '../layers.js';
import { PROMPT_LAYER_VERSIONS, PROMPT_VERSION } from '../promptVersion.js';
import { SAZOO_TONE_GUIDE, languageLabels } from '../shared.js';

const buildProfileLabel = (profile) => {
  if (!profile) return 'unknown';
  const birth = profile.birthDate
    ? `${profile.birthDate.year}.${profile.birthDate.month}.${profile.birthDate.day}`
    : 'birth unknown';
  return `${profile.name || 'unknown'} (${birth}, relation: ${profile.relation || 'me'})`;
};

export function buildCouplePrompt({ language, profile, miniAppContext }) {
  const selectedLanguage = languageLabels[language] || languageLabels.ko;
  const partnerProfile = miniAppContext?.partnerProfile || null;

  return [
    `Prompt version: ${PROMPT_VERSION}`,
    `Prompt layers: baseSystem:${PROMPT_LAYER_VERSIONS.baseSystem}, personaTone:${PROMPT_LAYER_VERSIONS.personaTone}, miniAppCouple:couple-1`,
    SAZOO_TONE_GUIDE,
    buildBaseSystemLayer(),
    buildPersonaToneLayer(),
    'You are handling the Couple Matching mini app, not the main chat reading.',
    `Language: ${selectedLanguage}.`,
    'Return strict JSON only.',
    'Do not include markdown or code fences.',
    'The result must feel playful but still premium and grounded.',
    `Person A: ${buildProfileLabel(profile)}`,
    `Person B: ${buildProfileLabel(partnerProfile)}`,
    '{',
    '  "score": number,',
    '  "summary": "one short sentence",',
    '  "detail": "compatibility reading in 200-300 chars max"',
    '}',
  ].join('\n');
}
