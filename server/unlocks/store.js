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

const normalizeReport = (report) => ({
  id: String(report?.id || '').trim(),
  type: 'invite_comparison',
  title: String(report?.title || '').trim(),
  summary: String(report?.summary || '').trim(),
  sourceInviteId: String(report?.sourceInviteId || '').trim(),
  unlockedAt: String(report?.unlockedAt || nowIso()).trim(),
});

const mergeReports = (left, right) => {
  const merged = new Map();
  for (const report of [...(left || []), ...(right || [])]) {
    const normalized = normalizeReport(report);
    if (!normalized.id) continue;
    const previous = merged.get(normalized.id);
    if (!previous || new Date(normalized.unlockedAt).getTime() >= new Date(previous.unlockedAt).getTime()) {
      merged.set(normalized.id, normalized);
    }
  }
  return [...merged.values()].sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
};

const ensureSchema = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS special_report_unlock_records (
      owner_key TEXT NOT NULL,
      report_id TEXT NOT NULL,
      installation_id TEXT,
      user_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      source_invite_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (owner_key, report_id)
    );

    CREATE INDEX IF NOT EXISTS idx_special_report_unlock_records_owner_updated
      ON special_report_unlock_records(owner_key, updated_at DESC);
  `);
};

const loadReports = (db, ownerKey) => db.prepare(`
  SELECT report_id, type, title, summary, source_invite_id, unlocked_at
  FROM special_report_unlock_records
  WHERE owner_key = ?
  ORDER BY datetime(unlocked_at) DESC
`).all(ownerKey).map((row) => ({
  id: row.report_id,
  type: row.type,
  title: row.title,
  summary: row.summary,
  sourceInviteId: row.source_invite_id,
  unlockedAt: row.unlocked_at,
}));

const persistReports = (db, ownerKey, identity, reports) => {
  const parsedOwner = parseOwnerKey(ownerKey);
  const installationId = parsedOwner.installationId || identity.installationId || null;
  const userId = parsedOwner.userId || identity.userId || null;
  const normalized = mergeReports([], reports);

  db.prepare('DELETE FROM special_report_unlock_records WHERE owner_key = ?').run(ownerKey);

  const insert = db.prepare(`
    INSERT INTO special_report_unlock_records (
      owner_key, report_id, installation_id, user_id, type, title, summary, source_invite_id, unlocked_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const report of normalized) {
    insert.run(
      ownerKey,
      report.id,
      installationId,
      userId,
      report.type,
      report.title,
      report.summary,
      report.sourceInviteId,
      report.unlockedAt,
      nowIso(),
    );
  }

  return normalized;
};

export function createUnlockStore(dbPath) {
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

  const resolveReports = (identity, snapshot) => {
    const ownerKeys = getOwnerKeys(identity);
    const mergedExisting = ownerKeys
      .slice()
      .reverse()
      .map((ownerKey) => loadReports(db, ownerKey))
      .reduce((accumulator, reports) => mergeReports(accumulator, reports), []);
    const merged = mergeReports(mergedExisting, snapshot || []);
    for (const ownerKey of ownerKeys) {
      persistReports(db, ownerKey, identity, merged);
    }
    return merged;
  };

  return {
    async listSpecialReports(identity, snapshot) {
      return withMutation(() => resolveReports(identity, snapshot || []));
    },
    async upsertSpecialReport(identity, report) {
      return withMutation(() => {
        const merged = resolveReports(identity, [report]);
        return merged.find((item) => item.id === report.id) || normalizeReport(report);
      });
    },
    async promoteToUser(identity, snapshot) {
      if (!identity?.userId) {
        return withMutation(() => resolveReports(identity, snapshot || []));
      }
      return withMutation(() => {
        const installationReports = loadReports(db, getInstallationKey(identity.installationId));
        const userReports = loadReports(db, getUserKey(identity.userId));
        const merged = mergeReports(mergeReports(installationReports, userReports), snapshot || []);
        persistReports(db, getUserKey(identity.userId), identity, merged);
        persistReports(db, getInstallationKey(identity.installationId), identity, merged);
        return merged;
      });
    },
  };
}
