import {
  createPostgresDatabase,
  ensureLaunchKvSchema,
  listKvRecords,
  loadKvRecord,
  upsertKvRecord,
} from '../db/postgres.js';
import { getInstallationKey, getOwnerKeys, getUserKey } from '../db/identity.js';

const NAMESPACE = 'chat_summaries';

const nowIso = () => new Date().toISOString();

const normalizeSummary = (value) => ({
  recentSummary: String(value?.recentSummary || '').trim().slice(0, 320),
  conversationDigest: String(value?.conversationDigest || '').trim().slice(0, 420),
  openLoops: [...new Set((Array.isArray(value?.openLoops) ? value.openLoops : []).map((item) => String(item || '').trim()).filter(Boolean))].slice(0, 4),
  lastAssistantGuidance: String(value?.lastAssistantGuidance || '').trim().slice(0, 220),
  updatedAt: String(value?.updatedAt || nowIso()).trim(),
});

const mergeSummaries = (left, right) => {
  const safeLeft = normalizeSummary(left || {});
  const safeRight = normalizeSummary(right || {});
  return {
    recentSummary: safeRight.recentSummary || safeLeft.recentSummary,
    conversationDigest: safeRight.conversationDigest || safeLeft.conversationDigest,
    openLoops: [...new Set([...(safeRight.openLoops || []), ...(safeLeft.openLoops || [])])].slice(0, 4),
    lastAssistantGuidance: safeRight.lastAssistantGuidance || safeLeft.lastAssistantGuidance,
    updatedAt: nowIso(),
  };
};

export function createChatSummaryStore(databaseUrl) {
  const db = createPostgresDatabase(databaseUrl);
  const ready = ensureLaunchKvSchema(db);

  const listProfileIds = async (executor, ownerKey) => {
    const rows = await listKvRecords(executor, NAMESPACE, ownerKey);
    return rows.map((row) => row.entityKey);
  };

  const resolveSummary = async (identity, profileId, snapshot, executor) => {
    const ownerKeys = getOwnerKeys(identity);
    let mergedExisting = normalizeSummary({});

    for (const ownerKey of ownerKeys.slice().reverse()) {
      const current = await loadKvRecord(executor, NAMESPACE, ownerKey, profileId);
      if (current) {
        mergedExisting = mergeSummaries(mergedExisting, current);
      }
    }

    const merged = mergeSummaries(mergedExisting, snapshot || {});
    for (const ownerKey of ownerKeys) {
      await upsertKvRecord(executor, NAMESPACE, ownerKey, profileId, identity, merged);
    }
    return merged;
  };

  return {
    async getSummary(identity, profileId, snapshot) {
      await ready;
      return db.withTransaction((client) => resolveSummary(identity, profileId, snapshot || {}, client));
    },
    async upsertSummary(identity, profileId, snapshot) {
      await ready;
      return db.withTransaction((client) => resolveSummary(identity, profileId, snapshot || {}, client));
    },
    async promoteToUser(identity, profileIds = []) {
      await ready;
      if (!identity?.userId) {
        return [];
      }

      return db.withTransaction(async (client) => {
        const installationKey = getInstallationKey(identity.installationId);
        const userKey = getUserKey(identity.userId);
        const mergedProfileIds = [...new Set([...profileIds, ...(await listProfileIds(client, installationKey)), ...(await listProfileIds(client, userKey))])];

        for (const profileId of mergedProfileIds) {
          const installationSummary = await loadKvRecord(client, NAMESPACE, installationKey, profileId);
          const userSummary = await loadKvRecord(client, NAMESPACE, userKey, profileId);
          const merged = mergeSummaries(installationSummary || {}, userSummary || {});
          await upsertKvRecord(client, NAMESPACE, userKey, profileId, identity, merged);
          await upsertKvRecord(client, NAMESPACE, installationKey, profileId, identity, merged);
        }

        return mergedProfileIds;
      });
    },
  };
}
