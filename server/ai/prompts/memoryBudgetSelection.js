const MEMORY_BUDGET_CONFIG = {
  day1_compact: {
    title: 'Day 1 Compact',
    maxPrimaryConcerns: 2,
    maxRecurringTopics: 2,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 120,
    includeConversationDigest: false,
    includeOpenLoops: false,
    includeLastAssistantGuidance: false,
    includeLastUserQuestions: true,
    maxLastUserQuestions: 1,
    maxRecentMessages: 1,
    maxRecentMessageChars: 120,
  },
  reopen_light: {
    title: 'Reopen Light',
    maxPrimaryConcerns: 2,
    maxRecurringTopics: 2,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 140,
    includeConversationDigest: false,
    includeOpenLoops: true,
    maxOpenLoops: 1,
    includeLastAssistantGuidance: false,
    includeLastUserQuestions: true,
    maxLastUserQuestions: 1,
    maxRecentMessages: 2,
    maxRecentMessageChars: 130,
  },
  question_habit: {
    title: 'Question Habit',
    maxPrimaryConcerns: 3,
    maxRecurringTopics: 2,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 150,
    includeConversationDigest: false,
    includeOpenLoops: true,
    maxOpenLoops: 2,
    includeLastAssistantGuidance: false,
    includeLastUserQuestions: true,
    maxLastUserQuestions: 2,
    maxRecentMessages: 2,
    maxRecentMessageChars: 140,
  },
  tone_probe: {
    title: 'Tone Probe',
    maxPrimaryConcerns: 3,
    maxRecurringTopics: 3,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 160,
    includeConversationDigest: false,
    includeOpenLoops: true,
    maxOpenLoops: 2,
    includeLastAssistantGuidance: true,
    lastAssistantGuidanceChars: 110,
    includeLastUserQuestions: true,
    maxLastUserQuestions: 2,
    maxRecentMessages: 3,
    maxRecentMessageChars: 150,
  },
  discovery_split: {
    title: 'Discovery Split',
    maxPrimaryConcerns: 3,
    maxRecurringTopics: 3,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 160,
    includeConversationDigest: true,
    conversationDigestChars: 160,
    includeOpenLoops: true,
    maxOpenLoops: 2,
    includeLastAssistantGuidance: false,
    includeLastUserQuestions: true,
    maxLastUserQuestions: 2,
    maxRecentMessages: 3,
    maxRecentMessageChars: 150,
  },
  pattern_preview: {
    title: 'Pattern Preview',
    maxPrimaryConcerns: 3,
    maxRecurringTopics: 4,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 170,
    includeConversationDigest: true,
    conversationDigestChars: 180,
    includeOpenLoops: true,
    maxOpenLoops: 2,
    includeLastAssistantGuidance: true,
    lastAssistantGuidanceChars: 120,
    includeLastUserQuestions: true,
    maxLastUserQuestions: 2,
    maxRecentMessages: 3,
    maxRecentMessageChars: 150,
  },
  weekly_wrap: {
    title: 'Weekly Wrap',
    maxPrimaryConcerns: 3,
    maxRecurringTopics: 4,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 180,
    includeConversationDigest: true,
    conversationDigestChars: 220,
    includeOpenLoops: true,
    maxOpenLoops: 2,
    includeLastAssistantGuidance: true,
    lastAssistantGuidanceChars: 150,
    includeLastUserQuestions: true,
    maxLastUserQuestions: 2,
    maxRecentMessages: 3,
    maxRecentMessageChars: 160,
  },
  pattern_balanced: {
    title: 'Pattern Balanced',
    maxPrimaryConcerns: 4,
    maxRecurringTopics: 4,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 200,
    includeConversationDigest: true,
    conversationDigestChars: 240,
    includeJourneySummary: true,
    journeySummaryChars: 180,
    journeySummaryMinQuality: 'emerging',
    includeOpenLoops: true,
    maxOpenLoops: 3,
    includeLastAssistantGuidance: true,
    lastAssistantGuidanceChars: 160,
    includeLastUserQuestions: true,
    maxLastUserQuestions: 3,
    maxRecentMessages: 4,
    maxRecentMessageChars: 170,
  },
  decision_support: {
    title: 'Decision Support',
    maxPrimaryConcerns: 4,
    maxRecurringTopics: 5,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 220,
    includeConversationDigest: true,
    conversationDigestChars: 280,
    includeJourneySummary: true,
    journeySummaryChars: 220,
    journeySummaryMinQuality: 'patterned',
    includeOpenLoops: true,
    maxOpenLoops: 3,
    includeLastAssistantGuidance: true,
    lastAssistantGuidanceChars: 180,
    includeLastUserQuestions: true,
    maxLastUserQuestions: 3,
    maxRecentMessages: 4,
    maxRecentMessageChars: 180,
  },
  personal_os: {
    title: 'Personal OS',
    maxPrimaryConcerns: 5,
    maxRecurringTopics: 5,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 240,
    includeConversationDigest: true,
    conversationDigestChars: 320,
    includeJourneySummary: true,
    journeySummaryChars: 300,
    journeySummaryMinQuality: 'patterned',
    includeOpenLoops: true,
    maxOpenLoops: 4,
    includeLastAssistantGuidance: true,
    lastAssistantGuidanceChars: 200,
    includeLastUserQuestions: true,
    maxLastUserQuestions: 3,
    maxRecentMessages: 4,
    maxRecentMessageChars: 190,
  },
  relationship_archive: {
    title: 'Relationship Archive',
    maxPrimaryConcerns: 5,
    maxRecurringTopics: 5,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 240,
    includeConversationDigest: true,
    conversationDigestChars: 340,
    includeJourneySummary: true,
    journeySummaryChars: 340,
    journeySummaryMinQuality: 'patterned',
    includeOpenLoops: true,
    maxOpenLoops: 4,
    includeLastAssistantGuidance: true,
    lastAssistantGuidanceChars: 200,
    includeLastUserQuestions: true,
    maxLastUserQuestions: 3,
    maxRecentMessages: 4,
    maxRecentMessageChars: 190,
  },
  time_archive: {
    title: 'Time Archive',
    maxPrimaryConcerns: 5,
    maxRecurringTopics: 5,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 260,
    includeConversationDigest: true,
    conversationDigestChars: 360,
    includeJourneySummary: true,
    journeySummaryChars: 380,
    journeySummaryMinQuality: 'rich',
    includeOpenLoops: true,
    maxOpenLoops: 4,
    includeLastAssistantGuidance: true,
    lastAssistantGuidanceChars: 220,
    includeLastUserQuestions: true,
    maxLastUserQuestions: 3,
    maxRecentMessages: 4,
    maxRecentMessageChars: 200,
  },
  balanced_private_reading: {
    title: 'Balanced Private Reading',
    maxPrimaryConcerns: 4,
    maxRecurringTopics: 4,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 200,
    includeConversationDigest: true,
    conversationDigestChars: 240,
    includeOpenLoops: true,
    maxOpenLoops: 3,
    includeLastAssistantGuidance: true,
    lastAssistantGuidanceChars: 160,
    includeLastUserQuestions: true,
    maxLastUserQuestions: 2,
    maxRecentMessages: 4,
    maxRecentMessageChars: 180,
  },
  daily_guided_compact: {
    title: 'Daily Guided Compact',
    maxPrimaryConcerns: 2,
    maxRecurringTopics: 2,
    includeRelationshipContext: false,
    includeRecentSummary: true,
    recentSummaryChars: 100,
    includeConversationDigest: false,
    includeOpenLoops: false,
    includeLastAssistantGuidance: false,
    includeLastUserQuestions: false,
    maxRecentMessages: 0,
    maxRecentMessageChars: 0,
  },
  daily_pattern_compact: {
    title: 'Daily Pattern Compact',
    maxPrimaryConcerns: 3,
    maxRecurringTopics: 3,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 120,
    includeConversationDigest: true,
    conversationDigestChars: 120,
    includeOpenLoops: false,
    includeLastAssistantGuidance: false,
    includeLastUserQuestions: false,
    maxRecentMessages: 0,
    maxRecentMessageChars: 0,
  },
  daily_archive_compact: {
    title: 'Daily Archive Compact',
    maxPrimaryConcerns: 3,
    maxRecurringTopics: 4,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 130,
    includeConversationDigest: true,
    conversationDigestChars: 160,
    includeJourneySummary: true,
    journeySummaryChars: 130,
    journeySummaryMinQuality: 'patterned',
    includeOpenLoops: false,
    includeLastAssistantGuidance: true,
    lastAssistantGuidanceChars: 100,
    includeLastUserQuestions: false,
    maxRecentMessages: 0,
    maxRecentMessageChars: 0,
  },
  miniapp_light_relationship: {
    title: 'Mini App Light Relationship',
    maxPrimaryConcerns: 2,
    maxRecurringTopics: 2,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 110,
    includeConversationDigest: false,
    includeOpenLoops: false,
    includeLastAssistantGuidance: false,
    includeLastUserQuestions: false,
    maxRecentMessages: 0,
    maxRecentMessageChars: 0,
  },
  miniapp_pattern_relationship: {
    title: 'Mini App Pattern Relationship',
    maxPrimaryConcerns: 3,
    maxRecurringTopics: 3,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 130,
    includeConversationDigest: true,
    conversationDigestChars: 130,
    includeOpenLoops: false,
    includeLastAssistantGuidance: false,
    includeLastUserQuestions: false,
    maxRecentMessages: 0,
    maxRecentMessageChars: 0,
  },
  miniapp_archive_relationship: {
    title: 'Mini App Archive Relationship',
    maxPrimaryConcerns: 3,
    maxRecurringTopics: 4,
    includeRelationshipContext: true,
    includeRecentSummary: true,
    recentSummaryChars: 150,
    includeConversationDigest: true,
    conversationDigestChars: 180,
    includeJourneySummary: true,
    journeySummaryChars: 120,
    journeySummaryMinQuality: 'patterned',
    includeOpenLoops: false,
    includeLastAssistantGuidance: true,
    lastAssistantGuidanceChars: 100,
    includeLastUserQuestions: false,
    maxRecentMessages: 0,
    maxRecentMessageChars: 0,
  },
  miniapp_light_symbolic: {
    title: 'Mini App Light Symbolic',
    maxPrimaryConcerns: 2,
    maxRecurringTopics: 2,
    includeRelationshipContext: false,
    includeRecentSummary: true,
    recentSummaryChars: 100,
    includeConversationDigest: false,
    includeOpenLoops: false,
    includeLastAssistantGuidance: false,
    includeLastUserQuestions: false,
    maxRecentMessages: 0,
    maxRecentMessageChars: 0,
  },
  miniapp_pattern_symbolic: {
    title: 'Mini App Pattern Symbolic',
    maxPrimaryConcerns: 2,
    maxRecurringTopics: 3,
    includeRelationshipContext: false,
    includeRecentSummary: true,
    recentSummaryChars: 120,
    includeConversationDigest: true,
    conversationDigestChars: 140,
    includeOpenLoops: false,
    includeLastAssistantGuidance: false,
    includeLastUserQuestions: false,
    maxRecentMessages: 0,
    maxRecentMessageChars: 0,
  },
  miniapp_archive_symbolic: {
    title: 'Mini App Archive Symbolic',
    maxPrimaryConcerns: 3,
    maxRecurringTopics: 4,
    includeRelationshipContext: false,
    includeRecentSummary: true,
    recentSummaryChars: 130,
    includeConversationDigest: true,
    conversationDigestChars: 180,
    includeJourneySummary: true,
    journeySummaryChars: 120,
    journeySummaryMinQuality: 'patterned',
    includeOpenLoops: false,
    includeLastAssistantGuidance: true,
    lastAssistantGuidanceChars: 100,
    includeLastUserQuestions: false,
    maxRecentMessages: 0,
    maxRecentMessageChars: 0,
  },
};

const DEFAULT_MEMORY_BUDGET_PRESET = 'balanced_private_reading';
const MEMORY_QUALITY_ORDER = {
  seed: 0,
  emerging: 1,
  patterned: 2,
  rich: 3,
};

function collapseWhitespace(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function ellipsize(text, maxLength) {
  const normalized = collapseWhitespace(text);
  if (!normalized || normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function limitStringList(values, maxItems, maxLength) {
  if (!Array.isArray(values) || maxItems <= 0) {
    return [];
  }

  return values
    .map((value) => ellipsize(value, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function meetsMemoryQualityThreshold(memoryQuality, minQuality) {
  if (!minQuality) {
    return true;
  }

  const resolvedCurrent = MEMORY_QUALITY_ORDER[memoryQuality] != null ? memoryQuality : 'seed';
  const resolvedMinimum = MEMORY_QUALITY_ORDER[minQuality] != null ? minQuality : 'seed';
  return MEMORY_QUALITY_ORDER[resolvedCurrent] >= MEMORY_QUALITY_ORDER[resolvedMinimum];
}

function trimRecentMessages(recentMessages, budget) {
  if (!Array.isArray(recentMessages) || budget.maxRecentMessages <= 0) {
    return [];
  }

  return recentMessages
    .slice(-budget.maxRecentMessages)
    .map((message) => ({
      role: message.role,
      text: ellipsize(message.text, budget.maxRecentMessageChars),
    }))
    .filter((message) => message.role && message.text);
}

export function resolveMemoryBudget(preset) {
  return MEMORY_BUDGET_CONFIG[preset] || MEMORY_BUDGET_CONFIG[DEFAULT_MEMORY_BUDGET_PRESET];
}

export function selectPromptMemoryPayload({
  memoryProfile,
  recentMessages,
  preset = DEFAULT_MEMORY_BUDGET_PRESET,
} = {}) {
  const budget = resolveMemoryBudget(preset);

  if (!memoryProfile) {
    return {
      budget,
      selectedMemoryProfile: null,
      selectedRecentMessages: trimRecentMessages(recentMessages, budget),
    };
  }

  const selectedMemoryProfile = {
    version: memoryProfile.version || 'unknown',
    knowledgeLevel: memoryProfile.knowledgeLevel || 'newbie',
    preferredTone: memoryProfile.preferredTone || 'mysterious_intimate',
    memoryQuality: MEMORY_QUALITY_ORDER[memoryProfile.memoryQuality] != null ? memoryProfile.memoryQuality : 'seed',
    primaryConcerns: limitStringList(memoryProfile.primaryConcerns, budget.maxPrimaryConcerns, 40),
    recurringTopics: limitStringList(memoryProfile.recurringTopics, budget.maxRecurringTopics, 40),
    relationshipContext: budget.includeRelationshipContext ? (memoryProfile.relationshipContext || null) : null,
    recentSummary: budget.includeRecentSummary
      ? ellipsize(memoryProfile.recentSummary, budget.recentSummaryChars)
      : '',
    conversationDigest: budget.includeConversationDigest
      ? ellipsize(memoryProfile.conversationDigest, budget.conversationDigestChars)
      : '',
    journeySummary: budget.includeJourneySummary
      && meetsMemoryQualityThreshold(memoryProfile.memoryQuality, budget.journeySummaryMinQuality)
      ? ellipsize(memoryProfile.journeySummary, budget.journeySummaryChars || 200)
      : '',
    openLoops: budget.includeOpenLoops
      ? limitStringList(memoryProfile.openLoops, budget.maxOpenLoops || 0, 120)
      : [],
    lastAssistantGuidance: budget.includeLastAssistantGuidance
      ? ellipsize(memoryProfile.lastAssistantGuidance, budget.lastAssistantGuidanceChars || 140)
      : '',
    lastUserQuestions: budget.includeLastUserQuestions
      ? limitStringList(memoryProfile.lastUserQuestions, budget.maxLastUserQuestions || 0, 110)
      : [],
  };

  return {
    budget,
    selectedMemoryProfile,
    selectedRecentMessages: trimRecentMessages(recentMessages, budget),
  };
}

export function buildMemoryBudgetLayer({ preset, budget }) {
  const resolvedBudget = budget || resolveMemoryBudget(preset);
  const enabledFields = [];

  if (resolvedBudget.includeRecentSummary) enabledFields.push('recentSummary');
  if (resolvedBudget.includeConversationDigest) enabledFields.push('conversationDigest');
  if (resolvedBudget.includeJourneySummary) enabledFields.push('journeySummary');
  if (resolvedBudget.includeOpenLoops) enabledFields.push('openLoops');
  if (resolvedBudget.includeLastAssistantGuidance) enabledFields.push('lastAssistantGuidance');
  if (resolvedBudget.includeLastUserQuestions) enabledFields.push('lastUserQuestions');
  if (resolvedBudget.includeRelationshipContext) enabledFields.push('relationshipContext');

  return [
    `Resolved memory budget preset: ${preset || DEFAULT_MEMORY_BUDGET_PRESET}.`,
    `Memory budget label: ${resolvedBudget.title}.`,
    `Primary concern slots: ${resolvedBudget.maxPrimaryConcerns}.`,
    `Recurring topic slots: ${resolvedBudget.maxRecurringTopics}.`,
    `Recent dialogue slots: ${resolvedBudget.maxRecentMessages}.`,
    `Journey summary threshold: ${resolvedBudget.journeySummaryMinQuality || 'not used'}.`,
    `Enabled memory fields: ${enabledFields.length > 0 ? enabledFields.join(', ') : 'none'}.`,
    'Memory budget rule: only the trimmed memory slices below are available. Do not assume missing fields still exist.',
  ].join('\n');
}
