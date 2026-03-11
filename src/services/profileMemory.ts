import { api, type AppLanguage, type UserProfile } from './api';
import { KEYS, storage } from './storage';

export const PROFILE_MEMORY_VERSION = 'phase4.v2';

export type MemoryKnowledgeLevel = 'newbie' | 'intermediate' | 'expert';
export type MemoryPreferredTone = 'mysterious_intimate';

export type MemoryTopic =
  | 'love'
  | 'wealth'
  | 'career'
  | 'health'
  | 'relationships'
  | 'family'
  | 'self'
  | 'timing';

export type ProgressiveProfileMemory = {
  version: string;
  profileId: string;
  knowledgeLevel: MemoryKnowledgeLevel;
  preferredTone: MemoryPreferredTone;
  primaryConcerns: string[];
  recurringTopics: Array<{
    topic: string;
    score: number;
    lastMentionedAt: string;
  }>;
  relationshipContext: {
    relation: string;
    focus?: string;
  } | null;
  recentSummary: string;
  conversationDigest: string;
  openLoops: string[];
  lastAssistantGuidance: string;
  lastUserQuestions: string[];
  updatedAt: string;
};

export type PromptMemoryProfile = {
  version: string;
  knowledgeLevel: MemoryKnowledgeLevel;
  preferredTone: MemoryPreferredTone;
  primaryConcerns: string[];
  recurringTopics: string[];
  relationshipContext?: {
    relation: string;
    focus?: string;
  } | null;
  recentSummary?: string;
  conversationDigest?: string;
  openLoops?: string[];
  lastAssistantGuidance?: string;
  lastUserQuestions?: string[];
};

type MemoryStore = Record<string, ProgressiveProfileMemory>;
type HistoryMessage = { role: 'user' | 'assistant'; text: string };

const TOPIC_KEYWORDS: Record<MemoryTopic, string[]> = {
  love: ['love', 'romance', 'dating', 'partner', 'crush', '연애', '사랑', '호감', '恋愛', '恋', '相手'],
  wealth: ['wealth', 'money', 'finance', 'salary', 'investment', '재물', '돈', '수입', '金運', 'お金'],
  career: ['career', 'job', 'work', 'business', 'promotion', '진로', '직장', '이직', '仕事', '転職'],
  health: ['health', 'body', 'sleep', 'stress', 'wellness', '건강', '수면', '회복', '健康', '体調'],
  relationships: ['relationship', 'people', 'friend', 'colleague', 'social', '인간관계', '친구', '동료', '人間関係', '友人'],
  family: ['family', 'parent', 'child', 'home', '가족', '부모', '자녀', '家族', '親'],
  self: ['mind', 'myself', 'identity', 'confidence', 'anxiety', '불안', '마음', '자신감', '自分', '不安'],
  timing: ['when', 'timing', 'today', 'month', 'year', '언제', '시기', '오늘', 'いつ', '時期'],
};

const MAX_TOPICS = 5;
const MAX_QUESTIONS = 3;
const MAX_OPEN_LOOPS = 4;
const MAX_SUMMARY_LENGTH = 260;

const unique = <T,>(values: T[]) => [...new Set(values.filter(Boolean))];
const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const ellipsize = (value: string, maxLength: number) => {
  const normalized = normalizeText(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
};

const isQuestionLike = (message: string) => {
  const normalized = normalizeText(message).toLowerCase();
  if (!normalized) return false;
  return (
    normalized.includes('?')
    || normalized.includes('어떻게')
    || normalized.includes('언제')
    || normalized.includes('될까요')
    || normalized.includes('괜찮을까요')
    || normalized.includes('should')
    || normalized.includes('when')
    || normalized.includes('how')
    || normalized.includes('will it')
    || normalized.includes('どう')
    || normalized.includes('いつ')
    || normalized.includes('でしょうか')
  );
};

const rankTopics = (messages: string[]) => {
  const scoreMap = new Map<string, number>();

  messages.forEach((message, index) => {
    const topics = detectTopics(message);
    const weight = index === messages.length - 1 ? 2 : 1;
    topics.forEach((topic) => {
      scoreMap.set(topic, (scoreMap.get(topic) || 0) + weight);
    });
  });

  return [...scoreMap.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1];
      return left[0].localeCompare(right[0]);
    })
    .map(([topic]) => topic);
};

const summarizeOlderDialogue = ({
  history,
  concern,
}: {
  history: HistoryMessage[];
  concern?: string | null;
}) => {
  const olderHistory = history.slice(0, Math.max(0, history.length - 4));
  if (olderHistory.length === 0) {
    return {
      conversationDigest: '',
      openLoops: [] as string[],
      lastAssistantGuidance: '',
    };
  }

  const olderUserMessages = olderHistory.filter((item) => item.role === 'user').map((item) => normalizeText(item.text));
  const olderAssistantMessages = olderHistory.filter((item) => item.role === 'assistant').map((item) => normalizeText(item.text));
  const rankedTopics = rankTopics(olderUserMessages);
  const topicLabel = unique([concern || '', ...rankedTopics]).slice(0, 3).join(', ');
  const latestConcern = olderUserMessages[olderUserMessages.length - 1] || '';
  const openLoops = unique(
    olderUserMessages
      .filter(isQuestionLike)
      .reverse()
      .map((message) => ellipsize(message, 120)),
  ).slice(0, MAX_OPEN_LOOPS);
  const lastAssistantGuidance = ellipsize(olderAssistantMessages[olderAssistantMessages.length - 1] || '', 180);

  const digestParts = [
    topicLabel ? `Earlier conversation themes: ${topicLabel}.` : '',
    latestConcern ? `The older thread kept circling back to: ${ellipsize(latestConcern, 120)}.` : '',
    openLoops[0] ? `The most recent unresolved question was: ${openLoops[0]}.` : '',
    lastAssistantGuidance ? `Previous guidance given: ${lastAssistantGuidance}.` : '',
  ].filter(Boolean);

  return {
    conversationDigest: ellipsize(digestParts.join(' '), 420),
    openLoops,
    lastAssistantGuidance,
  };
};

const detectTopics = (message: string) => {
  const text = normalizeText(message).toLowerCase();
  if (!text) return [] as string[];

  return Object.entries(TOPIC_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
    .map(([topic]) => topic)
    .slice(0, MAX_TOPICS);
};

const readMemoryStore = (): MemoryStore => storage.get(KEYS.PROFILE_MEMORY, {});
const writeMemoryStore = (nextStore: MemoryStore) => storage.set(KEYS.PROFILE_MEMORY, nextStore);

const toPromptMemoryProfile = (memory: ProgressiveProfileMemory): PromptMemoryProfile => ({
  version: memory.version || PROFILE_MEMORY_VERSION,
  knowledgeLevel: memory.knowledgeLevel || 'newbie',
  preferredTone: 'mysterious_intimate',
  primaryConcerns: memory.primaryConcerns.slice(0, MAX_TOPICS),
  recurringTopics: memory.recurringTopics.map((item) => item.topic).slice(0, MAX_TOPICS),
  relationshipContext: memory.relationshipContext || null,
  recentSummary: memory.recentSummary ? ellipsize(memory.recentSummary, MAX_SUMMARY_LENGTH) : '',
  conversationDigest: memory.conversationDigest ? ellipsize(memory.conversationDigest, 420) : '',
  openLoops: (memory.openLoops || []).slice(0, MAX_OPEN_LOOPS),
  lastAssistantGuidance: memory.lastAssistantGuidance ? ellipsize(memory.lastAssistantGuidance, 220) : '',
  lastUserQuestions: (memory.lastUserQuestions || []).slice(0, MAX_QUESTIONS),
});

const syncMemoryToServer = (profileId: string, memory: ProgressiveProfileMemory) => {
  void api.memory.upsertProfileMemory(profileId, toPromptMemoryProfile(memory)).catch(() => {
    // Keep local memory as the fast path. Server sync is best effort.
  });
};

const buildSeedMemory = ({
  profile,
  concern,
}: {
  profile: UserProfile;
  concern?: string | null;
}): ProgressiveProfileMemory => {
  const nowIso = new Date().toISOString();
  const primaryConcerns = unique([concern || '', profile.relation === 'me' ? 'self' : 'relationships']).slice(0, MAX_TOPICS);

  return {
    version: PROFILE_MEMORY_VERSION,
    profileId: profile.id,
    knowledgeLevel: (profile.knowledgeLevel || 'newbie') as MemoryKnowledgeLevel,
    preferredTone: 'mysterious_intimate',
    primaryConcerns,
    recurringTopics: primaryConcerns.map((topic) => ({
      topic,
      score: 1,
      lastMentionedAt: nowIso,
    })),
    relationshipContext: profile.relation ? { relation: profile.relation } : null,
    recentSummary: '',
    conversationDigest: '',
    openLoops: [],
    lastAssistantGuidance: '',
    lastUserQuestions: [],
    updatedAt: nowIso,
  };
};

const mergeRecurringTopics = (
  existing: ProgressiveProfileMemory['recurringTopics'],
  nextTopics: string[],
  nowIso: string,
) => {
  const topicMap = new Map<string, { topic: string; score: number; lastMentionedAt: string }>();

  for (const item of existing) {
    topicMap.set(item.topic, { ...item });
  }

  for (const topic of nextTopics) {
    const previous = topicMap.get(topic);
    topicMap.set(topic, {
      topic,
      score: Math.min(99, (previous?.score || 0) + 1),
      lastMentionedAt: nowIso,
    });
  }

  return [...topicMap.values()]
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return new Date(right.lastMentionedAt).getTime() - new Date(left.lastMentionedAt).getTime();
    })
    .slice(0, MAX_TOPICS);
};

const buildRecentSummary = ({
  concern,
  detectedTopics,
  message,
}: {
  language: AppLanguage;
  concern?: string | null;
  detectedTopics: string[];
  message: string;
}) => {
  const normalizedMessage = ellipsize(message, 110);
  const topicLabel = unique([concern || '', ...detectedTopics]).slice(0, 3).join(', ');

  return ellipsize(
    topicLabel
      ? `The user keeps returning to ${topicLabel}. Most recent question: ${normalizedMessage}`
      : `Most recent concern: ${normalizedMessage}`,
    MAX_SUMMARY_LENGTH,
  );
};

export const getProgressiveProfileMemory = (profileId: string) => {
  const store = readMemoryStore();
  return store[profileId] || null;
};

export const seedProgressiveProfileMemory = ({
  profile,
  concern,
}: {
  profile: UserProfile;
  concern?: string | null;
}) => {
  const store = readMemoryStore();
  const nextMemory: ProgressiveProfileMemory = {
    ...buildSeedMemory({ profile, concern }),
    ...store[profile.id],
    version: PROFILE_MEMORY_VERSION,
    knowledgeLevel: (profile.knowledgeLevel || store[profile.id]?.knowledgeLevel || 'newbie') as MemoryKnowledgeLevel,
    preferredTone: 'mysterious_intimate',
    relationshipContext: profile.relation
      ? { relation: profile.relation }
      : store[profile.id]?.relationshipContext || null,
    updatedAt: new Date().toISOString(),
  };

  writeMemoryStore({
    ...store,
    [profile.id]: nextMemory,
  });
  syncMemoryToServer(profile.id, nextMemory);

  return nextMemory;
};

export const updateProgressiveProfileMemory = ({
  profile,
  concern,
  language,
  message,
  conversationHistory,
}: {
  profile: UserProfile;
  concern?: string | null;
  language: AppLanguage;
  message: string;
  conversationHistory?: HistoryMessage[];
}) => {
  const nowIso = new Date().toISOString();
  const store = readMemoryStore();
  const previous = store[profile.id] || buildSeedMemory({ profile, concern });
  const detectedTopics = detectTopics(message);
  const nextTopics = unique([concern || '', ...detectedTopics]).slice(0, MAX_TOPICS);
  const normalizedQuestion = normalizeText(message);
  const olderDialogueSummary = summarizeOlderDialogue({
    history: conversationHistory || [],
    concern,
  });
  const nextMemory: ProgressiveProfileMemory = {
    ...previous,
    version: PROFILE_MEMORY_VERSION,
    knowledgeLevel: (profile.knowledgeLevel || previous.knowledgeLevel || 'newbie') as MemoryKnowledgeLevel,
    preferredTone: 'mysterious_intimate',
    primaryConcerns: unique([...previous.primaryConcerns, ...nextTopics]).slice(0, MAX_TOPICS),
    recurringTopics: mergeRecurringTopics(previous.recurringTopics || [], nextTopics, nowIso),
    relationshipContext: profile.relation
      ? {
          relation: profile.relation,
          focus: concern || previous.relationshipContext?.focus,
        }
      : previous.relationshipContext || null,
    recentSummary: buildRecentSummary({
      language,
      concern,
      detectedTopics,
      message: normalizedQuestion,
    }),
    conversationDigest: olderDialogueSummary.conversationDigest || previous.conversationDigest,
    openLoops: olderDialogueSummary.openLoops.length > 0
      ? olderDialogueSummary.openLoops
      : previous.openLoops,
    lastAssistantGuidance: olderDialogueSummary.lastAssistantGuidance || previous.lastAssistantGuidance,
    lastUserQuestions: unique([normalizedQuestion, ...(previous.lastUserQuestions || [])])
      .slice(0, MAX_QUESTIONS)
      .map((question) => ellipsize(question, 100)),
    updatedAt: nowIso,
  };

  writeMemoryStore({
    ...store,
    [profile.id]: nextMemory,
  });
  syncMemoryToServer(profile.id, nextMemory);

  return nextMemory;
};

export const hydrateProgressiveProfileMemory = async (profileId: string) => {
  const localMemory = getProgressiveProfileMemory(profileId);

  try {
    const serverMemory = await api.memory.getProfileMemory(profileId, localMemory ? toPromptMemoryProfile(localMemory) : undefined);
    const store = readMemoryStore();
    const previous = localMemory || buildSeedMemory({
      profile: {
        id: profileId,
        name: '',
        gender: null,
        knowledgeLevel: 'newbie',
        birthDate: { year: 1998, month: 5, day: 21, hour: 10, minute: 30, ampm: 'AM' },
        calendarType: 'solar',
        isTimeUnknown: false,
        relation: 'me',
        memo: '',
      },
      concern: null,
    });
    const hydrated: ProgressiveProfileMemory = {
      ...previous,
      version: serverMemory.version || PROFILE_MEMORY_VERSION,
      knowledgeLevel: serverMemory.knowledgeLevel || previous.knowledgeLevel,
      preferredTone: serverMemory.preferredTone || previous.preferredTone,
      primaryConcerns: unique(serverMemory.primaryConcerns || previous.primaryConcerns).slice(0, MAX_TOPICS),
      recurringTopics: unique([
        ...(serverMemory.recurringTopics || []),
        ...(previous.recurringTopics || []).map((item) => item.topic),
      ]).slice(0, MAX_TOPICS).map((topic, index) => ({
        topic,
        score: Math.max(1, MAX_TOPICS - index),
        lastMentionedAt: new Date().toISOString(),
      })),
      relationshipContext: serverMemory.relationshipContext || previous.relationshipContext || null,
      recentSummary: serverMemory.recentSummary || previous.recentSummary,
      conversationDigest: serverMemory.conversationDigest || previous.conversationDigest,
      openLoops: serverMemory.openLoops || previous.openLoops,
      lastAssistantGuidance: serverMemory.lastAssistantGuidance || previous.lastAssistantGuidance,
      lastUserQuestions: serverMemory.lastUserQuestions || previous.lastUserQuestions,
      updatedAt: new Date().toISOString(),
    };

    writeMemoryStore({
      ...store,
      [profileId]: hydrated,
    });

    return hydrated;
  } catch {
    return localMemory;
  }
};

export const getPromptMemoryProfile = (profileId: string, message: string): PromptMemoryProfile | null => {
  const memory = getProgressiveProfileMemory(profileId);
  if (!memory) return null;

  const detectedTopics = detectTopics(message);
  const recurringTopics = (memory.recurringTopics || []).map((item) => item.topic);
  const relevantTopics = unique([...detectedTopics, ...memory.primaryConcerns, ...recurringTopics]).slice(0, MAX_TOPICS);

  return {
    ...toPromptMemoryProfile(memory),
    recurringTopics: relevantTopics,
  };
};

