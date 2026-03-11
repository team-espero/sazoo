import {
  createPostgresDatabase,
  ensureLaunchKvSchema,
  listKvRecords,
  replaceKvNamespaceRecords,
} from '../db/postgres.js';
import { getInstallationKey, getOwnerKeys, getUserKey } from '../db/identity.js';

const NAMESPACE = 'special_report_unlocks';

const nowIso = () => new Date().toISOString();

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

export function createUnlockStore(databaseUrl) {
  const db = createPostgresDatabase(databaseUrl);
  const ready = ensureLaunchKvSchema(db);

  const loadReports = async (executor, ownerKey) => {
    const rows = await listKvRecords(executor, NAMESPACE, ownerKey);
    return rows.map((row) => row.data).filter(Boolean);
  };

  const persistReports = async (executor, ownerKey, identity, reports) => {
    const normalized = mergeReports([], reports);
    await replaceKvNamespaceRecords(
      executor,
      NAMESPACE,
      ownerKey,
      identity,
      normalized.map((report) => ({ entityKey: report.id, data: report })),
    );
    return normalized;
  };

  const resolveReports = async (identity, snapshot, executor) => {
    const ownerKeys = getOwnerKeys(identity);
    let mergedExisting = [];

    for (const ownerKey of ownerKeys.slice().reverse()) {
      const reports = await loadReports(executor, ownerKey);
      mergedExisting = mergeReports(mergedExisting, reports);
    }

    const merged = mergeReports(mergedExisting, snapshot || []);
    for (const ownerKey of ownerKeys) {
      await persistReports(executor, ownerKey, identity, merged);
    }
    return merged;
  };

  return {
    async listSpecialReports(identity, snapshot) {
      await ready;
      return db.withTransaction((client) => resolveReports(identity, snapshot || [], client));
    },
    async upsertSpecialReport(identity, report) {
      await ready;
      return db.withTransaction(async (client) => {
        const merged = await resolveReports(identity, [report], client);
        return merged.find((item) => item.id === report.id) || normalizeReport(report);
      });
    },
    async promoteToUser(identity, snapshot) {
      await ready;
      if (!identity?.userId) {
        return db.withTransaction((client) => resolveReports(identity, snapshot || [], client));
      }

      return db.withTransaction(async (client) => {
        const installationReports = await loadReports(client, getInstallationKey(identity.installationId));
        const userReports = await loadReports(client, getUserKey(identity.userId));
        const merged = mergeReports(mergeReports(installationReports, userReports), snapshot || []);
        await persistReports(client, getUserKey(identity.userId), identity, merged);
        await persistReports(client, getInstallationKey(identity.installationId), identity, merged);
        return merged;
      });
    },
  };
}
