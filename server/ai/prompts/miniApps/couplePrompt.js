import { buildMemoryContextBlock } from '../contextSelection.js';
import { buildBaseSystemLayer, buildInterpretationPolicyLayer, buildPersonaToneLayer } from '../layers.js';
import { buildMemoryBudgetLayer, selectPromptMemoryPayload } from '../memoryBudgetSelection.js';
import { buildMiniAppModeLayer, resolveMiniAppModeSelection } from '../lifecycleModeSelection.js';
import { PROMPT_LAYER_VERSIONS, PROMPT_VERSION } from '../promptVersion.js';
import { SAZOO_TONE_GUIDE, languageLabels } from '../shared.js';

const buildProfileLabel = (profile) => {
  if (!profile) return 'unknown';
  const birth = profile.birthDate
    ? `${profile.birthDate.year}.${profile.birthDate.month}.${profile.birthDate.day}`
    : 'birth unknown';
  return `${profile.name || 'unknown'} (${birth}, relation: ${profile.relation || 'me'})`;
};

export function buildCouplePrompt({ language, profile, miniAppContext, lifecycle, memoryProfile }) {
  const selectedLanguage = languageLabels[language] || languageLabels.ko;
  const partnerProfile = miniAppContext?.partnerProfile || null;
  const modeSelection = resolveMiniAppModeSelection({ lifecycle, miniAppKind: 'couple' });
  const memorySelection = selectPromptMemoryPayload({
    memoryProfile,
    preset: modeSelection.memoryBudgetPreset,
  });

  return [
    `Prompt version: ${PROMPT_VERSION}`,
    `Prompt layers: baseSystem:${PROMPT_LAYER_VERSIONS.baseSystem}, personaTone:${PROMPT_LAYER_VERSIONS.personaTone}, interpretationPolicy:${PROMPT_LAYER_VERSIONS.interpretationPolicy}, miniAppMode:${PROMPT_LAYER_VERSIONS.miniAppMode}, memoryContext:${PROMPT_LAYER_VERSIONS.memoryContext}, miniAppCouple:couple-2`,
    SAZOO_TONE_GUIDE,
    buildBaseSystemLayer(),
    buildPersonaToneLayer(),
    buildInterpretationPolicyLayer({ compact: true, channel: 'chat' }),
    buildMiniAppModeLayer(modeSelection),
    'You are handling the Couple Matching mini app, not the main chat reading.',
    `Language: ${selectedLanguage}.`,
    buildMemoryBudgetLayer({
      preset: modeSelection.memoryBudgetPreset,
      budget: memorySelection.budget,
    }),
    buildMemoryContextBlock(memorySelection.selectedMemoryProfile, 'relationship compatibility'),
    'Return strict JSON only.',
    'Do not include markdown or code fences.',
    'The result must feel playful but still premium, grounded, and emotionally safe.',
    'Do not treat compatibility as fixed fate, marriage certainty, breakup certainty, or relationship doom.',
    `Person A: ${buildProfileLabel(profile)}`,
    `Person B: ${buildProfileLabel(partnerProfile)}`,
    '{',
    '  "score": number,',
    '  "summary": "one short sentence",',
    '  "detail": "compatibility reading in 220-340 chars max"',
    '}',
  ].join('\n');
}
