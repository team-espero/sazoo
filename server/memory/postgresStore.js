import {
  createPostgresDatabase,
  ensureLaunchKvSchema,
  listKvRecords,
  loadKvRecord,
  upsertKvRecord,
} from '../db/postgres.js';
import { getInstallationKey, getOwnerKeys, getUserKey } from '../db/identity.js';

const NAMESPACE = 'profile_memory';
const MAX_TOPICS = 5;
const MAX_QUESTIONS = 3;
const MAX_OPEN_LOOPS = 4;

const unique = (values) => [...new Set((values || []).filter(Boolean))];
const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const normalizeQuestions = (values) => unique((values || []).map((value) => normalizeText(value))).slice(0, MAX_QUESTIONS);
const normalizeOpenLoops = (values) => unique((values || []).map((value) => normalizeText(value))).slice(0, MAX_OPEN_LOOPS);

const createEmptyMemory = () => ({
  version: 'phase4.v2',
  knowledgeLevel: 'newbie',
  preferredTone: 'mysterious_intimate',
  primaryConcerns: [],
  recurringTopics: [],
  relationshipContext: null,
  recentSummary: '',
  conversationDigest: '',
  openLoops: [],
  lastAssistantGuidance: '',
  lastUserQuestions: [],
  updatedAt: new Date().toISOString(),
});

const normalizeSnapshot = (value) => {
  const base = createEmptyMemory();
  return {
    version: normalizeText(value?.version) || base.version,
    knowledgeLevel: value?.knowledgeLevel || base.knowledgeLevel,
    preferredTone: value?.preferredTone || base.preferredTone,
    primaryConcerns: unique((value?.primaryConcerns || []).map((item) => normalizeText(item))).slice(0, MAX_TOPICS),
    recurringTopics: unique((value?.recurringTopics || []).map((item) => normalizeText(item))).slice(0, MAX_TOPICS),
    relationshipContext: value?.relationshipContext?.relation
      ? {
          relation: normalizeText(value.relationshipContext.relation),
          focus: normalizeText(value.relationshipContext.focus || ''),
        }
      : null,
    recentSummary: normalizeText(value?.recentSummary || '').slice(0, 320),
    conversationDigest: normalizeText(value?.conversationDigest || '').slice(0, 420),
    openLoops: normalizeOpenLoops(value?.openLoops || []),
    lastAssistantGuidance: normalizeText(value?.lastAssistantGuidance || '').slice(0, 220),
    lastUserQuestions: normalizeQuestions(value?.lastUserQuestions || []),
    updatedAt: normalizeText(value?.updatedAt) || new Date().toISOString(),
  };
};

const mergeSnapshots = (left, right) => {
  const safeLeft = normalizeSnapshot(left || {});
  const safeRight = normalizeSnapshot(right || {});

  return {
    version: safeRight.version || safeLeft.version,
    knowledgeLevel: safeRight.knowledgeLevel || safeLeft.knowledgeLevel,
    preferredTone: safeRight.preferredTone || safeLeft.preferredTone,
    primaryConcerns: unique([...safeRight.primaryConcerns, ...safeLeft.primaryConcerns]).slice(0, MAX_TOPICS),
    recurringTopics: unique([...safeRight.recurringTopics, ...safeLeft.recurringTopics]).slice(0, MAX_TOPICS),
    relationshipContext: safeRight.relationshipContext || safeLeft.relationshipContext || null,
    recentSummary: safeRight.recentSummary || safeLeft.recentSummary || '',
    conversationDigest: safeRight.conversationDigest || safeLeft.conversationDigest || '',
    openLoops: unique([...safeRight.openLoops, ...safeLeft.openLoops]).slice(0, MAX_OPEN_LOOPS),
    lastAssistantGuidance: safeRight.lastAssistantGuidance || safeLeft.lastAssistantGuidance || '',
    lastUserQuestions: unique([...safeRight.lastUserQuestions, ...safeLeft.lastUserQuestions]).slice(0, MAX_QUESTIONS),
    updatedAt: new Date().toISOString(),
  };
};

export function createProfileMemoryStore(databaseUrl) {
  const db = createPostgresDatabase(databaseUrl);
  const ready = ensureLaunchKvSchema(db);

  const resolveSnapshot = async (identity, profileId, snapshot, executor) => {
    const ownerKeys = getOwnerKeys(identity);
    let merged = snapshot || createEmptyMemory();

    for (const ownerKey of ownerKeys) {
      const current = await loadKvRecord(executor, NAMESPACE, ownerKey, profileId);
      if (current) {
        merged = mergeSnapshots(merged, current);
      }
    }

    const normalized = mergeSnapshots(merged, snapshot || {});
    for (const ownerKey of ownerKeys) {
      await upsertKvRecord(executor, NAMESPACE, ownerKey, profileId, identity, normalized);
    }
    return normalized;
  };

  return {
    async getMemory(identity, profileId, snapshot) {
      await ready;
      return db.withTransaction((client) => resolveSnapshot(identity, profileId, snapshot || {}, client));
    },
    async upsertMemory(identity, profileId, snapshot) {
      await ready;
      return db.withTransaction((client) => resolveSnapshot(identity, profileId, snapshot || {}, client));
    },
    async promoteToUser(identity, profileIds = []) {
      await ready;
      if (!identity?.userId) {
        return [];
      }

      return db.withTransaction(async (client) => {
        const installationKey = getInstallationKey(identity.installationId);
        const userKey = getUserKey(identity.userId);
        const discoveredProfileIds = [...new Set([
          ...profileIds,
          ...(await listKvRecords(client, NAMESPACE, installationKey)).map((row) => row.entityKey),
          ...(await listKvRecords(client, NAMESPACE, userKey)).map((row) => row.entityKey),
        ])];

        for (const profileId of discoveredProfileIds) {
          const installationSnapshot = await loadKvRecord(client, NAMESPACE, installationKey, profileId);
          const userSnapshot = await loadKvRecord(client, NAMESPACE, userKey, profileId);
          const merged = mergeSnapshots(installationSnapshot || {}, userSnapshot || {});
          await upsertKvRecord(client, NAMESPACE, userKey, profileId, identity, merged);
          await upsertKvRecord(client, NAMESPACE, installationKey, profileId, identity, merged);
        }

        return discoveredProfileIds;
      });
    },
  };
}
