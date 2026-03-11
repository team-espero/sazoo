import { openLaunchDatabase } from '../db/launchDb.js';

const nowIso = () => new Date().toISOString();

const getInstallationKey = (installationId) => `installation:${installationId}`;
const getUserKey = (userId) => (userId ? `user:${userId}` : null);
const getOwnerKeys = ({ installationId, userId }) => {
  const keys = [getInstallationKey(installationId)];
  const userKey = getUserKey(userId);
  if (userKey) keys.unshift(userKey);
  return keys;
};

const parseOwnerKey = (ownerKey) => {
  if (ownerKey.startsWith('installation:')) {
    return { installationId: ownerKey.replace('installation:', ''), userId: null };
  }
  if (ownerKey.startsWith('user:')) {
    return { installationId: null, userId: ownerKey.replace('user:', '') };
  }
  return { installationId: null, userId: null };
};

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

const ensureSchema = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_summary_records (
      owner_key TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      installation_id TEXT,
      user_id TEXT,
      recent_summary TEXT NOT NULL,
      conversation_digest TEXT NOT NULL,
      open_loops_json TEXT NOT NULL,
      last_assistant_guidance TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (owner_key, profile_id)
    );

    CREATE INDEX IF NOT EXISTS idx_chat_summary_records_owner_updated
      ON chat_summary_records(owner_key, updated_at DESC);
  `);
};

const loadSummary = (db, ownerKey, profileId) => {
  const row = db.prepare(`
    SELECT recent_summary, conversation_digest, open_loops_json, last_assistant_guidance, updated_at
    FROM chat_summary_records
    WHERE owner_key = ? AND profile_id = ?
  `).get(ownerKey, profileId);

  if (!row) return null;

  return normalizeSummary({
    recentSummary: row.recent_summary,
    conversationDigest: row.conversation_digest,
    openLoops: JSON.parse(row.open_loops_json || '[]'),
    lastAssistantGuidance: row.last_assistant_guidance,
    updatedAt: row.updated_at,
  });
};

const listProfileIds = (db, ownerKey) => db.prepare(`
  SELECT profile_id
  FROM chat_summary_records
  WHERE owner_key = ?
`).all(ownerKey).map((row) => row.profile_id);

const persistSummary = (db, ownerKey, identity, profileId, summary) => {
  const parsedOwner = parseOwnerKey(ownerKey);
  const installationId = parsedOwner.installationId || identity.installationId || null;
  const userId = parsedOwner.userId || identity.userId || null;
  const normalized = normalizeSummary(summary);

  db.prepare(`
    INSERT INTO chat_summary_records (
      owner_key, profile_id, installation_id, user_id, recent_summary, conversation_digest, open_loops_json, last_assistant_guidance, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(owner_key, profile_id) DO UPDATE SET
      installation_id = excluded.installation_id,
      user_id = excluded.user_id,
      recent_summary = excluded.recent_summary,
      conversation_digest = excluded.conversation_digest,
      open_loops_json = excluded.open_loops_json,
      last_assistant_guidance = excluded.last_assistant_guidance,
      updated_at = excluded.updated_at
  `).run(
    ownerKey,
    profileId,
    installationId,
    userId,
    normalized.recentSummary,
    normalized.conversationDigest,
    JSON.stringify(normalized.openLoops),
    normalized.lastAssistantGuidance,
    normalized.updatedAt,
  );

  return normalized;
};

export function createChatSummaryStore(dbPath) {
  const { db } = openLaunchDatabase(dbPath);
  ensureSchema(db);

  let writeQueue = Promise.resolve();
  const withMutation = async (handler) => {
    let result;
    let caughtError;
    const run = async () => {
      try {
        result = handler();
        return result;
      } catch (error) {
        caughtError = error;
        return undefined;
      }
    };

    writeQueue = writeQueue.then(run, run);
    await writeQueue;
    if (caughtError) throw caughtError;
    return result;
  };

  const resolveSummary = (identity, profileId, snapshot) => {
    const ownerKeys = getOwnerKeys(identity);
    const mergedExisting = ownerKeys
      .slice()
      .reverse()
      .map((ownerKey) => loadSummary(db, ownerKey, profileId))
      .filter(Boolean)
      .reduce((accumulator, item) => mergeSummaries(accumulator, item), normalizeSummary({}));
    const merged = mergeSummaries(mergedExisting, snapshot || {});
    for (const ownerKey of ownerKeys) {
      persistSummary(db, ownerKey, identity, profileId, merged);
    }
    return merged;
  };

  return {
    async getSummary(identity, profileId, snapshot) {
      return withMutation(() => resolveSummary(identity, profileId, snapshot || {}));
    },
    async upsertSummary(identity, profileId, snapshot) {
      return withMutation(() => resolveSummary(identity, profileId, snapshot || {}));
    },
    async promoteToUser(identity, profileIds = []) {
      if (!identity?.userId) {
        return [];
      }
      return withMutation(() => {
        const installationKey = getInstallationKey(identity.installationId);
        const userKey = getUserKey(identity.userId);
        const mergedProfileIds = [...new Set([...profileIds, ...listProfileIds(db, installationKey), ...listProfileIds(db, userKey)])];
        for (const profileId of mergedProfileIds) {
          const installationSummary = loadSummary(db, installationKey, profileId);
          const userSummary = loadSummary(db, userKey, profileId);
          const merged = mergeSummaries(installationSummary || {}, userSummary || {});
          persistSummary(db, userKey, identity, profileId, merged);
          persistSummary(db, installationKey, identity, profileId, merged);
        }
        return mergedProfileIds;
      });
    },
  };
}
