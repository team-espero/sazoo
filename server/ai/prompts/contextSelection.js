const TOPIC_KEYWORDS = {
  love: ['love', 'romance', 'dating', 'partner', '연애', '사랑', '호감', '썸', '결혼', '恋愛', '好き', '交際'],
  wealth: ['wealth', 'money', 'finance', 'salary', 'investment', '재물', '돈', '수입', '투자', '사업', '金運', 'お金', '投資'],
  career: ['career', 'job', 'work', 'business', 'promotion', '진로', '직장', '이직', '사업', '승진', '仕事', '転職', '昇進'],
  health: ['health', 'body', 'sleep', 'stress', '건강', '몸', '수면', '스트레스', '회복', '健康', '体調', '睡眠'],
  relationships: ['relationship', 'people', 'friend', 'colleague', '대인관계', '인간관계', '친구', '동료', '対人関係', '友人', '同僚'],
  family: ['family', 'parent', 'child', '가족', '부모', '자녀', '家庭', '家族', '親', '子ども'],
  self: ['myself', 'mind', 'identity', 'confidence', '불안', '마음', '자신감', '자존감', '自己', '不安', '気持ち'],
  timing: ['when', 'timing', 'today', 'month', 'year', '언제', '시기', '오늘', '이번 달', '올해', 'いつ', '時期', '今日'],
};

const MAX_MEMORY_TOPICS = 4;
const MAX_RECENT_MESSAGES = 4;

const unique = (values) => [...new Set(values.filter(Boolean))];
const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const ellipsize = (value, maxLength) => {
  const normalized = normalizeText(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
};

export function detectIntentTopics(message) {
  const text = normalizeText(message).toLowerCase();
  if (!text) return [];

  return Object.entries(TOPIC_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword.toLowerCase())))
    .map(([topic]) => topic)
    .slice(0, MAX_MEMORY_TOPICS);
}

export function buildMemoryContextBlock(memoryProfile, message) {
  if (!memoryProfile) {
    return 'Progressive memory: unavailable';
  }

  const detectedTopics = detectIntentTopics(message);
  const relevantTopics = unique([
    ...detectedTopics,
    ...(memoryProfile.primaryConcerns || []),
    ...(memoryProfile.recurringTopics || []),
  ]).slice(0, MAX_MEMORY_TOPICS);

  const lines = [
    `Memory version: ${memoryProfile.version || 'unknown'}`,
    `Knowledge level: ${memoryProfile.knowledgeLevel || 'newbie'}`,
    `Preferred tone: ${memoryProfile.preferredTone || 'mysterious_intimate'}`,
  ];

  if (relevantTopics.length > 0) {
    lines.push(`Relevant concern themes: ${relevantTopics.join(', ')}`);
  }

  if (memoryProfile.relationshipContext?.relation) {
    lines.push(`Relationship context: ${memoryProfile.relationshipContext.relation}`);
  }

  if (memoryProfile.relationshipContext?.focus) {
    lines.push(`Relationship focus: ${memoryProfile.relationshipContext.focus}`);
  }

  if (memoryProfile.recentSummary) {
    lines.push(`Medium-term memory summary: ${ellipsize(memoryProfile.recentSummary, 320)}`);
  }

  if (memoryProfile.conversationDigest) {
    lines.push(`Older dialogue digest: ${ellipsize(memoryProfile.conversationDigest, 420)}`);
  }

  if (Array.isArray(memoryProfile.openLoops) && memoryProfile.openLoops.length > 0) {
    lines.push(`Open loops to respect: ${memoryProfile.openLoops.map((item) => ellipsize(item, 120)).join(' | ')}`);
  }

  if (memoryProfile.lastAssistantGuidance) {
    lines.push(`Previous guidance already given: ${ellipsize(memoryProfile.lastAssistantGuidance, 220)}`);
  }

  if (Array.isArray(memoryProfile.lastUserQuestions) && memoryProfile.lastUserQuestions.length > 0) {
    lines.push(`Recent user questions: ${memoryProfile.lastUserQuestions.map((question) => ellipsize(question, 110)).join(' | ')}`);
  }

  return lines.join('\n');
}

export function buildRecentDialogueContext(recentMessages) {
  if (!Array.isArray(recentMessages) || recentMessages.length === 0) {
    return 'Short-term dialogue memory: none';
  }

  const normalizedMessages = recentMessages
    .slice(-MAX_RECENT_MESSAGES)
    .map((message) => `${message.role}: ${ellipsize(message.text, 180)}`)
    .filter(Boolean);

  if (normalizedMessages.length === 0) {
    return 'Short-term dialogue memory: none';
  }

  return `Short-term dialogue memory:\n${normalizedMessages.join('\n')}`;
}
