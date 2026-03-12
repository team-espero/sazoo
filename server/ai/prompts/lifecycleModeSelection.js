export const LIFECYCLE_STAGES = [
  'day1_activation',
  'day2_reopen',
  'day3_question_habit',
  'day4_tone_learning',
  'day5_discovery',
  'day6_pattern_preview',
  'day7_weekly_wrap',
  'pattern_building',
  'decision_support',
  'personal_os',
  'relationship_archive',
  'time_archive',
];

export const LIFECYCLE_MODES = ['product_led', 'memory_led'];

export const MAIN_CHAT_PROMPT_MODES = [
  ...LIFECYCLE_STAGES,
  'ongoing_private_reading',
];

export const DAILY_INSIGHT_PROMPT_MODES = [
  'daily_guided_focus',
  'daily_pattern_signal',
  'daily_decision_signal',
  'daily_archive_signal',
];

export const MINI_APP_PROMPT_MODES = ['miniapp_couple', 'miniapp_dream'];

const MAIN_CHAT_PROMPT_MODE_SET = new Set(MAIN_CHAT_PROMPT_MODES);
const MINI_APP_PROMPT_MODE_SET = new Set(MINI_APP_PROMPT_MODES);
const LIFECYCLE_STAGE_SET = new Set(LIFECYCLE_STAGES);
const LIFECYCLE_MODE_SET = new Set(LIFECYCLE_MODES);

const MAIN_CHAT_PROMPT_CONFIG = {
  day1_activation: {
    title: 'Day 1 Activation',
    lifecycleMode: 'product_led',
    memoryBudgetPreset: 'day1_compact',
    profilingPreset: 'observe_only',
    uiJourneyPreset: 'guided_first_value',
    isEarlyGuidedJourney: true,
    instructions: [
      'Experience goal: create immediate trust with one clear saju current the user can feel today.',
      'Stay premium and calm, but remove any fog. The user should understand the center of the chart quickly.',
      'Do not try to impress with too many concepts. One strong current and one supporting reason are enough.',
      'Make the reading feel like the first careful opening of a private archive, not a dramatic prophecy.',
    ],
    template: [
      'Sentence 1: name the strongest present current in plain language.',
      'Sentence 2: explain which chart structure or elemental balance creates that current.',
      'Sentence 3: bridge it to the users current daily life or emotional state.',
      'Sentence 4: offer one grounded action the user can try before the day ends.',
    ],
  },
  day2_reopen: {
    title: 'Day 2 Reopen',
    lifecycleMode: 'product_led',
    memoryBudgetPreset: 'reopen_light',
    profilingPreset: 'behavior_observation',
    uiJourneyPreset: 'guided_reopen',
    isEarlyGuidedJourney: true,
    instructions: [
      'Experience goal: reward the return visit by making the reading feel connected to yesterday without sounding repetitive.',
      'Reference continuity softly. The user should feel remembered, not tracked.',
      'Keep the response easy to reopen and easy to act on within one day.',
      'The tone should say: the thread is continuing, and you are not starting from zero.',
    ],
    template: [
      'Sentence 1: show how todays current connects to the earlier flow.',
      'Sentence 2: name what is slightly clearer, heavier, or more sensitive today.',
      'Sentence 3: point to one practical thing to notice in work, relationships, or mood.',
      'Sentence 4: leave one gentle follow-up angle the user may ask next.',
    ],
  },
  day3_question_habit: {
    title: 'Day 3 Question Habit',
    lifecycleMode: 'product_led',
    memoryBudgetPreset: 'question_habit',
    profilingPreset: 'question_seed',
    uiJourneyPreset: 'guided_questions',
    isEarlyGuidedJourney: true,
    instructions: [
      'Experience goal: make asking a follow-up question feel natural and rewarding.',
      'Answer the current question cleanly, then open a meaningful next doorway.',
      'Reflect the user concern back in simple language so the next question feels obvious.',
      'Keep the reading useful, not open-ended for its own sake.',
    ],
    template: [
      'Sentence 1: answer the visible concern directly.',
      'Sentence 2: explain the pattern behind that concern in plain language.',
      'Sentence 3: show where that pattern is likely to surface next.',
      'Sentence 4: suggest one natural next question or angle to explore.',
    ],
  },
  day4_tone_learning: {
    title: 'Day 4 Tone Learning',
    lifecycleMode: 'product_led',
    memoryBudgetPreset: 'tone_probe',
    profilingPreset: 'tone_learning',
    uiJourneyPreset: 'guided_tone_fit',
    isEarlyGuidedJourney: true,
    instructions: [
      'Experience goal: infer the users preferred reading temperature without making the answer feel experimental.',
      'Use the same premium tone, but calibrate the balance between reassurance and strategy.',
      'Show emotional steadiness and precision at the same time.',
      'If the chart suggests friction, phrase it as something to handle skillfully, not something to fear.',
    ],
    template: [
      'Sentence 1: acknowledge the emotional texture of the current concern.',
      'Sentence 2: explain the structural reason beneath that feeling.',
      'Sentence 3: show the calmer or more strategic response that suits this user.',
      'Sentence 4: offer one action that feels both soft and practical.',
    ],
  },
  day5_discovery: {
    title: 'Day 5 Discovery',
    lifecycleMode: 'product_led',
    memoryBudgetPreset: 'discovery_split',
    profilingPreset: 'interest_expansion',
    uiJourneyPreset: 'guided_discovery',
    isEarlyGuidedJourney: true,
    instructions: [
      'Experience goal: widen the map of where the user may want saju help, without losing the core concern.',
      'Bridge lightly from the main topic into adjacent life domains such as timing, money, work, or love.',
      'Stay inviting and exploratory. The user should feel more doors opening, not more burden.',
      'A discovery-day reading still needs one practical takeaway.',
    ],
    template: [
      'Sentence 1: ground the reading in the current main concern.',
      'Sentence 2: show which adjacent life area is quietly linked to it.',
      'Sentence 3: explain why those two areas are moving together now.',
      'Sentence 4: give one grounded action and one soft hint about what to explore next.',
    ],
  },
  day6_pattern_preview: {
    title: 'Day 6 Pattern Preview',
    lifecycleMode: 'product_led',
    memoryBudgetPreset: 'pattern_preview',
    profilingPreset: 'pattern_preview',
    uiJourneyPreset: 'guided_pattern_preview',
    isEarlyGuidedJourney: true,
    instructions: [
      'Experience goal: let the user feel the first glimpse of a recurring pattern without overcommitting.',
      'Name tendencies, not verdicts.',
      'The reading should feel like the first careful recognition of a pattern that has been there all along.',
      'Keep agency intact. Recognition should lead to action, not fatalism.',
    ],
    template: [
      'Sentence 1: name the repeating tendency that seems to be emerging.',
      'Sentence 2: explain what in the chart makes that tendency return.',
      'Sentence 3: connect it to a familiar real-life scene the user will recognize.',
      'Sentence 4: suggest how to respond differently the next time it appears.',
    ],
  },
  day7_weekly_wrap: {
    title: 'Day 7 Weekly Wrap',
    lifecycleMode: 'product_led',
    memoryBudgetPreset: 'weekly_wrap',
    profilingPreset: 'weekly_seed',
    uiJourneyPreset: 'guided_weekly_wrap',
    isEarlyGuidedJourney: true,
    instructions: [
      'Experience goal: close the guided first week with emotional coherence and trust.',
      'Summarize what has repeated most clearly across the week.',
      'Prepare the user for a more memory-led reading journey from this point forward.',
      'The response should feel like a soft weekly wrap, not a grand ceremony.',
    ],
    template: [
      'Sentence 1: summarize the strongest pattern that has repeated this week.',
      'Sentence 2: explain what chart structure keeps feeding that pattern.',
      'Sentence 3: show what the user now understands more clearly than on day one.',
      'Sentence 4: offer one next-week operating principle that carries the reading forward.',
    ],
  },
  pattern_building: {
    title: 'Pattern Building',
    lifecycleMode: 'memory_led',
    memoryBudgetPreset: 'pattern_balanced',
    profilingPreset: 'pattern_growth',
    uiJourneyPreset: 'memory_pattern_building',
    isEarlyGuidedJourney: false,
    instructions: [
      'Experience goal: turn repeated questions into a coherent pattern the user can understand.',
      'Use memory as pattern evidence, not as proof of hidden surveillance.',
      'This stage should feel more personal than the first week, but still light enough to return to often.',
      'The reading should help the user see how one concern keeps linking to another.',
    ],
    template: [
      'Sentence 1: identify the recurring pattern connected to the current question.',
      'Sentence 2: explain why this pattern tends to repeat in the chart and in lived behavior.',
      'Sentence 3: show what the user usually does inside this pattern.',
      'Sentence 4: suggest one small behavioral shift that changes the pattern next time.',
    ],
  },
  decision_support: {
    title: 'Decision Support',
    lifecycleMode: 'memory_led',
    memoryBudgetPreset: 'decision_support',
    profilingPreset: 'decision_style_learning',
    uiJourneyPreset: 'memory_decision_support',
    isEarlyGuidedJourney: false,
    instructions: [
      'Experience goal: help the user choose better, not choose for them.',
      'Frame tradeoffs, timing, emotional cost, and energetic readiness.',
      'Saju here is a decision lens, not a decision command.',
      'The reading should lower confusion and increase agency.',
    ],
    template: [
      'Sentence 1: state what the real decision pressure is underneath the question.',
      'Sentence 2: explain the current favorable and unfavorable conditions in the chart.',
      'Sentence 3: compare two possible directions without certainty theater.',
      'Sentence 4: suggest what to watch before choosing and one grounded next move.',
    ],
  },
  personal_os: {
    title: 'Personal OS',
    lifecycleMode: 'memory_led',
    memoryBudgetPreset: 'personal_os',
    profilingPreset: 'identity_pattern_learning',
    uiJourneyPreset: 'memory_personal_os',
    isEarlyGuidedJourney: false,
    instructions: [
      'Experience goal: make the reading feel like a stable operating system for this users life.',
      'Use recurring topics, tone preference, prior guidance, and longer arc patterns together when relevant.',
      'The answer should feel deeply tailored but still calm and readable.',
      'Show what rhythm repeatedly helps this user regain balance.',
    ],
    template: [
      'Sentence 1: describe the users current state in a way that feels specifically theirs.',
      'Sentence 2: connect the present issue to a longer personal rhythm or habit.',
      'Sentence 3: explain what kind of response tends to restore this users balance.',
      'Sentence 4: offer one concrete operating principle the user can apply now.',
    ],
  },
  relationship_archive: {
    title: 'Relationship Archive',
    lifecycleMode: 'memory_led',
    memoryBudgetPreset: 'relationship_archive',
    profilingPreset: 'long_arc_relational',
    uiJourneyPreset: 'memory_relationship_archive',
    isEarlyGuidedJourney: false,
    instructions: [
      'Experience goal: reflect how the user has changed across a meaningful stretch of time.',
      'Compare earlier and current patterns in a respectful, non-creepy way.',
      'This stage should feel wise and intimate, with visible long-arc memory.',
      'Growth and repeated friction should both be acknowledged with steadiness.',
    ],
    template: [
      'Sentence 1: describe what has changed in the users pattern over time.',
      'Sentence 2: explain what still returns despite that growth.',
      'Sentence 3: connect the chart to the relational or emotional arc behind the change.',
      'Sentence 4: suggest what new response is now required from the user.',
    ],
  },
  time_archive: {
    title: 'Time Archive',
    lifecycleMode: 'memory_led',
    memoryBudgetPreset: 'time_archive',
    profilingPreset: 'long_arc_archival',
    uiJourneyPreset: 'memory_time_archive',
    isEarlyGuidedJourney: false,
    instructions: [
      'Experience goal: treat the reading like part of a long personal archive.',
      'Hold time, change, memory, and present movement together in one calm narrative.',
      'The answer should feel earned, intimate, and deeply coherent.',
      'Never become grandiose or prophetic just because the user has stayed a long time.',
    ],
    template: [
      'Sentence 1: place the current question inside the longer arc of the users life journey.',
      'Sentence 2: explain what has matured, softened, or become clearer over time.',
      'Sentence 3: name the old pattern that still deserves careful handling.',
      'Sentence 4: offer one present-day action that honors both memory and change.',
    ],
  },
  ongoing_private_reading: {
    title: 'Ongoing Private Reading',
    lifecycleMode: 'memory_led',
    memoryBudgetPreset: 'balanced_private_reading',
    profilingPreset: 'steady_observation',
    uiJourneyPreset: 'conversation_default',
    isEarlyGuidedJourney: false,
    instructions: [
      'Experience goal: continue the reading naturally when lifecycle data is partial or unresolved.',
      'Stay anchored in the present question first, then bring in only clearly relevant memory.',
      'Do not force lifecycle commentary if the stage is not obvious.',
      'The user should still feel continuity and care.',
    ],
    template: [
      'Sentence 1: answer the current question directly.',
      'Sentence 2: explain the structural reason beneath the current concern.',
      'Sentence 3: connect one relevant recurring pattern when helpful.',
      'Sentence 4: give one grounded next action without overextending the claim.',
    ],
  },
};

const DAILY_INSIGHT_MODE_CONFIG = {
  daily_guided_focus: {
    title: 'Daily Guided Focus',
    memoryBudgetPreset: 'daily_guided_compact',
    lifecycleMode: 'product_led',
    instructions: [
      'Experience goal: make the home card feel immediately useful during the guided first week.',
      'Keep the insight short, calm, and easy to apply before noon.',
      'Do not overload the user with too many symbolic layers on the home card.',
    ],
    template: [
      'Tip 1: name todays dominant tone in plain language.',
      'Tip 2: link it to one small action, attitude, or timing cue the user can use today.',
    ],
  },
  daily_pattern_signal: {
    title: 'Daily Pattern Signal',
    memoryBudgetPreset: 'daily_pattern_compact',
    lifecycleMode: 'memory_led',
    instructions: [
      'Experience goal: let the daily card feel lightly personalized from repeated concerns.',
      'Connect todays tone to a recurring pattern without sounding heavy.',
      'Keep each tip compact enough to live comfortably on the home screen.',
    ],
    template: [
      'Tip 1: name todays dominant tone.',
      'Tip 2: show how it touches a familiar recurring theme.',
      'Tip 3: offer one very small adjustment for today.',
    ],
  },
  daily_decision_signal: {
    title: 'Daily Decision Signal',
    memoryBudgetPreset: 'daily_pattern_compact',
    lifecycleMode: 'memory_led',
    instructions: [
      'Experience goal: help the user make cleaner day-scale decisions.',
      'Surface one thing to lean into and one thing to avoid rushing.',
      'The card should feel practical, not predictive.',
    ],
    template: [
      'Tip 1: identify where todays energy supports progress.',
      'Tip 2: identify where the user should slow down or observe first.',
      'Tip 3: keep the language short enough for glanceable cards.',
    ],
  },
  daily_archive_signal: {
    title: 'Daily Archive Signal',
    memoryBudgetPreset: 'daily_archive_compact',
    lifecycleMode: 'memory_led',
    instructions: [
      'Experience goal: make the daily card feel like a small note from a longer archive.',
      'Use long-arc memory only as a subtle undertone.',
      'Keep the card gentle and elegant, never grandiose.',
    ],
    template: [
      'Tip 1: name todays emotional or energetic tone.',
      'Tip 2: link it softly to the users longer rhythm.',
      'Tip 3: point to one quiet way to use the day well.',
    ],
  },
};

const MINI_APP_MODE_CONFIG = {
  couple_discovery_bridge: {
    title: 'Couple Discovery Bridge',
    memoryBudgetPreset: 'miniapp_light_relationship',
    instructions: [
      'This is still a playful entry-phase reading, but it should feel premium and emotionally intelligent.',
      'Focus on chemistry, emotional rhythm, and one practical way the pair can balance each other.',
      'Do not turn compatibility into fate or final judgment.',
    ],
    template: [
      'Line 1: summarize the emotional chemistry.',
      'Line 2: name one natural strength the pair can grow through.',
      'Line 3: name one friction pattern and how to handle it with care.',
    ],
  },
  couple_pattern_reflection: {
    title: 'Couple Pattern Reflection',
    memoryBudgetPreset: 'miniapp_pattern_relationship',
    instructions: [
      'Reflect compatibility as an interaction pattern, not a fixed score of destiny.',
      'Connect the pairing to recurring relationship tendencies when relevant.',
      'Keep the tone warm, elegant, and slightly playful.',
    ],
    template: [
      'Line 1: summarize the pair dynamic in premium plain language.',
      'Line 2: show which recurring emotional pattern the pair activates.',
      'Line 3: offer one grounded suggestion that improves harmony.',
    ],
  },
  couple_long_arc_reflection: {
    title: 'Couple Long Arc Reflection',
    memoryBudgetPreset: 'miniapp_archive_relationship',
    instructions: [
      'Use longer-arc relational insight when it is clearly relevant, but stay compact and readable.',
      'This should feel reflective, not heavy.',
      'The result should remain a mini-app result, not a full main-chat reading.',
    ],
    template: [
      'Line 1: state the core compatibility arc.',
      'Line 2: name one strength that deepens over time and one friction that repeats.',
      'Line 3: suggest how the pair can work with that rhythm rather than against it.',
    ],
  },
  dream_symbol_intro: {
    title: 'Dream Symbol Intro',
    memoryBudgetPreset: 'miniapp_light_symbolic',
    instructions: [
      'Interpret the dream as emotional symbolism and inner movement, not as a supernatural decree.',
      'Keep the reading intimate, soft, and clear.',
      'The result should feel like a small luminous note, not a lecture.',
    ],
    template: [
      'Sentence 1: state the emotional meaning of the dream.',
      'Sentence 2: translate the symbol into a present-life movement.',
      'Sentence 3: offer one calm clue about what to notice next.',
    ],
  },
  dream_pattern_bridge: {
    title: 'Dream Pattern Bridge',
    memoryBudgetPreset: 'miniapp_pattern_symbolic',
    instructions: [
      'Use recurring emotional patterns lightly when they match the dream text.',
      'Keep the reading symbolic, personal, and non-creepy.',
      'Do not overload the dream reading with main chat detail.',
    ],
    template: [
      'Sentence 1: name the emotional undertone of the dream.',
      'Sentence 2: connect the image to a recurring concern or inner pattern if clearly relevant.',
      'Sentence 3: give one grounded next-step clue for the day ahead.',
    ],
  },
  dream_archive_resonance: {
    title: 'Dream Archive Resonance',
    memoryBudgetPreset: 'miniapp_archive_symbolic',
    instructions: [
      'Let the dream feel like a symbolic echo inside the users longer archive.',
      'Stay restrained. One elegant bridge is enough.',
      'The result must remain short and emotionally safe.',
    ],
    template: [
      'Sentence 1: state the dream mood and symbol clearly.',
      'Sentence 2: link it softly to a longer emotional rhythm when relevant.',
      'Sentence 3: offer one quiet behavioral or reflective cue.',
    ],
  },
};

function normalizeRequestedPromptMode(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  return normalized;
}

function normalizeLifecycleStage(value) {
  const normalized = String(value || '').trim();
  if (!normalized || !LIFECYCLE_STAGE_SET.has(normalized)) return null;
  return normalized;
}

function normalizeLifecycleMode(value) {
  const normalized = String(value || '').trim();
  if (!normalized || !LIFECYCLE_MODE_SET.has(normalized)) return null;
  return normalized;
}

function clampInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.floor(parsed));
}

function deriveStageFromDays(daysSinceReference) {
  if (daysSinceReference == null) return null;
  if (daysSinceReference <= 0) return 'day1_activation';
  if (daysSinceReference === 1) return 'day2_reopen';
  if (daysSinceReference === 2) return 'day3_question_habit';
  if (daysSinceReference === 3) return 'day4_tone_learning';
  if (daysSinceReference === 4) return 'day5_discovery';
  if (daysSinceReference === 5) return 'day6_pattern_preview';
  if (daysSinceReference === 6) return 'day7_weekly_wrap';
  if (daysSinceReference <= 27) return 'pattern_building';
  if (daysSinceReference <= 59) return 'decision_support';
  if (daysSinceReference <= 179) return 'personal_os';
  if (daysSinceReference <= 364) return 'relationship_archive';
  return 'time_archive';
}

function deriveLifecycleStage({ lifecycle, isInitialAnalysis }) {
  const explicitLifecycleStage = normalizeLifecycleStage(lifecycle?.stage);
  const daysSinceFirstReading = clampInt(lifecycle?.daysSinceFirstReading);
  const daysSinceOnboarding = clampInt(lifecycle?.daysSinceOnboarding);

  return explicitLifecycleStage
    || deriveStageFromDays(daysSinceFirstReading ?? daysSinceOnboarding)
    || (isInitialAnalysis ? 'day1_activation' : null);
}

function buildSelectionLayer({
  label,
  selection,
}) {
  return [
    `Resolved ${label} mode: ${selection.promptMode}.`,
    `Lifecycle stage: ${selection.lifecycleStage || 'unresolved'}.`,
    `Lifecycle mode: ${selection.lifecycleMode}.`,
    `Memory budget preset: ${selection.memoryBudgetPreset}.`,
    `Mode label: ${selection.title}.`,
    'Mode instructions:',
    ...selection.instructions.map((item) => `- ${item}`),
    'Response template:',
    ...selection.template.map((item) => `- ${item}`),
  ].join('\n');
}

export function isMiniAppPromptMode(value) {
  return MINI_APP_PROMPT_MODE_SET.has(String(value || '').trim());
}

export function isMainChatPromptMode(value) {
  return MAIN_CHAT_PROMPT_MODE_SET.has(String(value || '').trim());
}

export function resolvePromptModeSelection({
  requestedPromptMode = 'chat',
  lifecycle,
  isInitialAnalysis = false,
} = {}) {
  const normalizedRequestedMode = normalizeRequestedPromptMode(requestedPromptMode);
  const explicitLifecycleMode = normalizeLifecycleMode(lifecycle?.mode);
  const lifecycleStage = deriveLifecycleStage({ lifecycle, isInitialAnalysis });

  let resolvedPromptMode = 'ongoing_private_reading';

  if (normalizedRequestedMode && isMainChatPromptMode(normalizedRequestedMode)) {
    resolvedPromptMode = normalizedRequestedMode;
  } else if (lifecycleStage) {
    resolvedPromptMode = lifecycleStage;
  } else if (isInitialAnalysis) {
    resolvedPromptMode = 'day1_activation';
  }

  const config = MAIN_CHAT_PROMPT_CONFIG[resolvedPromptMode] || MAIN_CHAT_PROMPT_CONFIG.ongoing_private_reading;

  return {
    promptMode: resolvedPromptMode,
    lifecycleStage: lifecycleStage || (resolvedPromptMode !== 'ongoing_private_reading' ? resolvedPromptMode : null),
    lifecycleMode: explicitLifecycleMode || config.lifecycleMode,
    memoryBudgetPreset: config.memoryBudgetPreset,
    profilingPreset: config.profilingPreset,
    uiJourneyPreset: config.uiJourneyPreset,
    isEarlyGuidedJourney: config.isEarlyGuidedJourney,
    title: config.title,
    instructions: config.instructions,
    template: config.template,
  };
}

export function buildPromptModeLayer(selection) {
  if (!selection) return '';
  return buildSelectionLayer({ label: 'prompt', selection });
}

export function resolveDailyInsightModeSelection({ lifecycle } = {}) {
  const lifecycleStage = deriveLifecycleStage({ lifecycle, isInitialAnalysis: false });
  let promptMode = 'daily_pattern_signal';

  if (!lifecycleStage || lifecycleStage.startsWith('day')) {
    promptMode = 'daily_guided_focus';
  } else if (lifecycleStage === 'pattern_building') {
    promptMode = 'daily_pattern_signal';
  } else if (lifecycleStage === 'decision_support' || lifecycleStage === 'personal_os') {
    promptMode = 'daily_decision_signal';
  } else {
    promptMode = 'daily_archive_signal';
  }

  const config = DAILY_INSIGHT_MODE_CONFIG[promptMode];

  return {
    promptMode,
    lifecycleStage,
    lifecycleMode: config.lifecycleMode,
    memoryBudgetPreset: config.memoryBudgetPreset,
    title: config.title,
    instructions: config.instructions,
    template: config.template,
  };
}

export function buildDailyInsightModeLayer(selection) {
  if (!selection) return '';
  return buildSelectionLayer({ label: 'daily insight', selection });
}

export function resolveMiniAppModeSelection({ lifecycle, miniAppKind } = {}) {
  const lifecycleStage = deriveLifecycleStage({ lifecycle, isInitialAnalysis: false });
  const normalizedKind = String(miniAppKind || '').trim();
  let promptMode = normalizedKind === 'dream'
    ? 'dream_pattern_bridge'
    : 'couple_pattern_reflection';

  if (!lifecycleStage || lifecycleStage.startsWith('day')) {
    promptMode = normalizedKind === 'dream'
      ? 'dream_symbol_intro'
      : 'couple_discovery_bridge';
  } else if (lifecycleStage === 'pattern_building' || lifecycleStage === 'decision_support') {
    promptMode = normalizedKind === 'dream'
      ? 'dream_pattern_bridge'
      : 'couple_pattern_reflection';
  } else {
    promptMode = normalizedKind === 'dream'
      ? 'dream_archive_resonance'
      : 'couple_long_arc_reflection';
  }

  const config = MINI_APP_MODE_CONFIG[promptMode];

  return {
    promptMode,
    lifecycleStage,
    lifecycleMode: lifecycleStage && lifecycleStage.startsWith('day') ? 'product_led' : 'memory_led',
    memoryBudgetPreset: config.memoryBudgetPreset,
    title: config.title,
    instructions: config.instructions,
    template: config.template,
  };
}

export function buildMiniAppModeLayer(selection) {
  if (!selection) return '';
  return buildSelectionLayer({ label: 'mini app', selection });
}

