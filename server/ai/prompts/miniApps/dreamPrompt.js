import { buildMemoryContextBlock } from '../contextSelection.js';
import { buildBaseSystemLayer, buildInterpretationPolicyLayer, buildPersonaToneLayer } from '../layers.js';
import { buildMiniAppModeLayer, resolveMiniAppModeSelection } from '../lifecycleModeSelection.js';
import { buildMemoryBudgetLayer, selectPromptMemoryPayload } from '../memoryBudgetSelection.js';
import { PROMPT_LAYER_VERSIONS, PROMPT_VERSION } from '../promptVersion.js';
import { SAZOO_TONE_GUIDE, languageLabels } from '../shared.js';

export function buildDreamPrompt({ language, miniAppContext, lifecycle, memoryProfile }) {
  const selectedLanguage = languageLabels[language] || languageLabels.ko;
  const dreamText = String(miniAppContext?.dreamText || '').trim();
  const modeSelection = resolveMiniAppModeSelection({ lifecycle, miniAppKind: 'dream' });
  const memorySelection = selectPromptMemoryPayload({
    memoryProfile,
    preset: modeSelection.memoryBudgetPreset,
  });

  return [
    `Prompt version: ${PROMPT_VERSION}`,
    `Prompt layers: baseSystem:${PROMPT_LAYER_VERSIONS.baseSystem}, personaTone:${PROMPT_LAYER_VERSIONS.personaTone}, interpretationPolicy:${PROMPT_LAYER_VERSIONS.interpretationPolicy}, miniAppMode:${PROMPT_LAYER_VERSIONS.miniAppMode}, memoryContext:${PROMPT_LAYER_VERSIONS.memoryContext}, miniAppDream:dream-3`,
    SAZOO_TONE_GUIDE,
    buildBaseSystemLayer(),
    buildPersonaToneLayer(),
    buildInterpretationPolicyLayer({ compact: true, channel: 'chat' }),
    buildMiniAppModeLayer(modeSelection),
    'You are handling the Dream Reading mini app, not the main chat reading.',
    `Language: ${selectedLanguage}.`,
    buildMemoryBudgetLayer({
      preset: modeSelection.memoryBudgetPreset,
      budget: memorySelection.budget,
    }),
    buildMemoryContextBlock(memorySelection.selectedMemoryProfile, dreamText),
    'Interpret the dream in a mystical but intimate tone.',
    'Treat dream images as emotional, symbolic, and psychological signals rather than as fixed prophecy.',
    'Return plain text only.',
    'Structure rule: write 2 or 3 compact sentences.',
    'Length rule: aim for roughly 110-220 characters in the selected language, and never answer with only one short sentence.',
    'Content rule: explain the emotional meaning first, translate the symbol second, then give one calm next-step clue.',
    `Dream text: ${dreamText}`,
  ].join('\n');
}
