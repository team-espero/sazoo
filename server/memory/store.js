import { existsSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openLaunchDatabase } from '../db/launchDb.js';

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

const getInstallationKey = (installationId) => `installation:${installationId}`;
const getUserKey = (userId) => (userId ? `user:${userId}` : null);
const getOwnerKeys = ({ installationId, userId }) => {
  const keys = [getInstallationKey(installationId)];
  const userKey = getUserKey(userId);
  if (userKey) {
    keys.unshift(userKey);
  }
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

const ensureSchema = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile_memory_records (
      owner_key TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      installation_id TEXT,
      user_id TEXT,
      version TEXT NOT NULL,
      knowledge_level TEXT NOT NULL,
      preferred_tone TEXT NOT NULL,
      primary_concerns_json TEXT NOT NULL,
      recurring_topics_json TEXT NOT NULL,
      relationship_context_json TEXT NOT NULL,
      recent_summary TEXT NOT NULL,
      conversation_digest TEXT NOT NULL,
      open_loops_json TEXT NOT NULL,
      last_assistant_guidance TEXT NOT NULL,
      last_user_questions_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (owner_key, profile_id)
    );

    CREATE INDEX IF NOT EXISTS idx_profile_memory_records_owner_updated
      ON profile_memory_records(owner_key, updated_at DESC);
  `);
};

const readJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const loadSnapshot = (db, ownerKey, profileId) => {
  const row = db.prepare(`
    SELECT version, knowledge_level, preferred_tone, primary_concerns_json, recurring_topics_json,
           relationship_context_json, recent_summary, conversation_digest, open_loops_json,
           last_assistant_guidance, last_user_questions_json, updated_at
    FROM profile_memory_records
    WHERE owner_key = ? AND profile_id = ?
  `).get(ownerKey, profileId);

  if (!row) return null;

  return normalizeSnapshot({
    version: row.version,
    knowledgeLevel: row.knowledge_level,
    preferredTone: row.preferred_tone,
    primaryConcerns: readJson(row.primary_concerns_json, []),
    recurringTopics: readJson(row.recurring_topics_json, []),
    relationshipContext: readJson(row.relationship_context_json, null),
    recentSummary: row.recent_summary,
    conversationDigest: row.conversation_digest,
    openLoops: readJson(row.open_loops_json, []),
    lastAssistantGuidance: row.last_assistant_guidance,
    lastUserQuestions: readJson(row.last_user_questions_json, []),
    updatedAt: row.updated_at,
  });
};

const persistSnapshot = (db, ownerKey, identity, profileId, snapshot) => {
  const parsedOwner = parseOwnerKey(ownerKey);
  const installationId = parsedOwner.installationId || identity.installationId || null;
  const userId = parsedOwner.userId || identity.userId || null;
  const normalized = normalizeSnapshot(snapshot);

  db.prepare(`
    INSERT INTO profile_memory_records (
      owner_key, profile_id, installation_id, user_id, version, knowledge_level, preferred_tone,
      primary_concerns_json, recurring_topics_json, relationship_context_json, recent_summary,
      conversation_digest, open_loops_json, last_assistant_guidance, last_user_questions_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(owner_key, profile_id) DO UPDATE SET
      installation_id = excluded.installation_id,
      user_id = excluded.user_id,
      version = excluded.version,
      knowledge_level = excluded.knowledge_level,
      preferred_tone = excluded.preferred_tone,
      primary_concerns_json = excluded.primary_concerns_json,
      recurring_topics_json = excluded.recurring_topics_json,
      relationship_context_json = excluded.relationship_context_json,
      recent_summary = excluded.recent_summary,
      conversation_digest = excluded.conversation_digest,
      open_loops_json = excluded.open_loops_json,
      last_assistant_guidance = excluded.last_assistant_guidance,
      last_user_questions_json = excluded.last_user_questions_json,
      updated_at = excluded.updated_at
  `).run(
    ownerKey,
    profileId,
    installationId,
    userId,
    normalized.version,
    normalized.knowledgeLevel,
    normalized.preferredTone,
    JSON.stringify(normalized.primaryConcerns),
    JSON.stringify(normalized.recurringTopics),
    JSON.stringify(normalized.relationshipContext || null),
    normalized.recentSummary,
    normalized.conversationDigest,
    JSON.stringify(normalized.openLoops),
    normalized.lastAssistantGuidance,
    JSON.stringify(normalized.lastUserQuestions),
    normalized.updatedAt,
  );
};

const readLegacyRows = (legacyPath) => {
  if (!legacyPath || !existsSync(legacyPath)) {
    return [];
  }

  const legacyDb = new DatabaseSync(legacyPath);
  try {
    const hasTable = legacyDb.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name = 'profile_memory'
    `).get();

    if (!hasTable) {
      return [];
    }

    return legacyDb.prepare(`
      SELECT owner_key, profile_id, installation_id, user_id, version, knowledge_level, preferred_tone,
             primary_concerns_json, recurring_topics_json, relationship_context_json, recent_summary,
             last_user_questions_json, updated_at
      FROM profile_memory
    `).all();
  } finally {
    legacyDb.close();
  }
};

const migrateLegacyMemoryDb = (db, migrationSourcePath, targetPath) => {
  const existingCount = db.prepare('SELECT COUNT(*) AS count FROM profile_memory_records').get().count;
  if (existingCount > 0 || !migrationSourcePath) {
    return;
  }

  const resolvedSource = path.resolve(migrationSourcePath);
  const resolvedTarget = path.resolve(targetPath);
  if (resolvedSource === resolvedTarget) {
    return;
  }

  const rows = readLegacyRows(resolvedSource);
  if (rows.length === 0) {
    return;
  }

  for (const row of rows) {
    const identity = {
      installationId: row.installation_id || parseOwnerKey(row.owner_key).installationId || 'legacy_installation',
      userId: row.user_id || parseOwnerKey(row.owner_key).userId || undefined,
    };
    persistSnapshot(db, row.owner_key, identity, row.profile_id, {
      version: row.version,
      knowledgeLevel: row.knowledge_level,
      preferredTone: row.preferred_tone,
      primaryConcerns: readJson(row.primary_concerns_json, []),
      recurringTopics: readJson(row.recurring_topics_json, []),
      relationshipContext: readJson(row.relationship_context_json, null),
      recentSummary: row.recent_summary,
      conversationDigest: '',
      openLoops: [],
      lastAssistantGuidance: '',
      lastUserQuestions: readJson(row.last_user_questions_json, []),
      updatedAt: row.updated_at,
    });
  }
};

export function createProfileMemoryStore(dbPath, options = {}) {
  const { db, resolvedPath } = openLaunchDatabase(dbPath);
  ensureSchema(db);
  migrateLegacyMemoryDb(db, options.migrationSourcePath, resolvedPath);

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
    if (caughtError) {
      throw caughtError;
    }
    return result;
  };

  const resolveSnapshot = (identity, profileId, snapshot) => {
    const ownerKeys = getOwnerKeys(identity);
    const merged = ownerKeys
      .map((ownerKey) => loadSnapshot(db, ownerKey, profileId))
      .filter(Boolean)
      .reduce((accumulator, item) => mergeSnapshots(accumulator, item), snapshot || createEmptyMemory());

    const normalized = mergeSnapshots(merged, snapshot || {});
    for (const ownerKey of ownerKeys) {
      persistSnapshot(db, ownerKey, identity, profileId, normalized);
    }
    return normalized;
  };

  return {
    async getMemory(identity, profileId, snapshot) {
      return withMutation(() => resolveSnapshot(identity, profileId, snapshot || {}));
    },
    async upsertMemory(identity, profileId, snapshot) {
      return withMutation(() => resolveSnapshot(identity, profileId, snapshot || {}));
    },
    async promoteToUser(identity, profileIds = []) {
      if (!identity?.userId) {
        return [];
      }

      return withMutation(() => {
        const installationKey = getInstallationKey(identity.installationId);
        const userKey = getUserKey(identity.userId);
        const discoveredProfileIds = db.prepare(`
          SELECT DISTINCT profile_id
          FROM profile_memory_records
          WHERE owner_key IN (?, ?)
        `).all(installationKey, userKey).map((row) => row.profile_id);
        const mergedProfileIds = [...new Set([...(profileIds || []), ...discoveredProfileIds])];

        for (const profileId of mergedProfileIds) {
          const installationSnapshot = loadSnapshot(db, installationKey, profileId);
          const userSnapshot = loadSnapshot(db, userKey, profileId);
          const merged = mergeSnapshots(installationSnapshot || {}, userSnapshot || {});
          persistSnapshot(db, userKey, identity, profileId, merged);
          persistSnapshot(db, installationKey, identity, profileId, merged);
        }

        return mergedProfileIds;
      });
    },
  };
}

