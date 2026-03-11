import { openLaunchDatabase } from '../db/launchDb.js';

const normalizeMetadata = (value) => ({
  inviteId: String(value?.inviteId || '').trim(),
  installationId: value?.installationId ? String(value.installationId).trim() : undefined,
  userId: value?.userId ? String(value.userId).trim() : undefined,
  source: value?.source === 'daily_fortune' ? 'daily_fortune' : 'daily_fortune',
  targetTab: ['home', 'chat', 'calendar', 'miniapps', 'profile'].includes(String(value?.targetTab)) ? String(value.targetTab) : 'home',
  inviterName: String(value?.inviterName || '').trim().slice(0, 80),
  previewTitle: String(value?.previewTitle || '').trim().slice(0, 160),
  previewSummary: String(value?.previewSummary || '').trim().slice(0, 420),
  comparisonSummary: String(value?.comparisonSummary || '').trim().slice(0, 420),
  shareUrl: String(value?.shareUrl || '').trim().slice(0, 2048),
  language: ['en', 'ko', 'ja'].includes(String(value?.language)) ? String(value.language) : 'ko',
  createdAt: String(value?.createdAt || new Date().toISOString()),
  updatedAt: new Date().toISOString(),
});

const ensureSchema = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS share_metadata_records (
      invite_id TEXT PRIMARY KEY,
      installation_id TEXT,
      user_id TEXT,
      source TEXT NOT NULL,
      target_tab TEXT NOT NULL,
      inviter_name TEXT NOT NULL,
      preview_title TEXT NOT NULL,
      preview_summary TEXT NOT NULL,
      comparison_summary TEXT NOT NULL,
      share_url TEXT NOT NULL,
      language TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_share_metadata_updated
      ON share_metadata_records(updated_at DESC);
  `);
};

const loadMetadata = (db, inviteId) => {
  const row = db.prepare(`
    SELECT invite_id, installation_id, user_id, source, target_tab, inviter_name, preview_title, preview_summary,
           comparison_summary, share_url, language, created_at, updated_at
    FROM share_metadata_records
    WHERE invite_id = ?
  `).get(inviteId);

  if (!row) return null;

  return normalizeMetadata({
    inviteId: row.invite_id,
    installationId: row.installation_id || undefined,
    userId: row.user_id || undefined,
    source: row.source,
    targetTab: row.target_tab,
    inviterName: row.inviter_name,
    previewTitle: row.preview_title,
    previewSummary: row.preview_summary,
    comparisonSummary: row.comparison_summary,
    shareUrl: row.share_url,
    language: row.language,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

const persistMetadata = (db, identity, metadata) => {
  const normalized = normalizeMetadata(metadata);
  db.prepare(`
    INSERT INTO share_metadata_records (
      invite_id, installation_id, user_id, source, target_tab, inviter_name,
      preview_title, preview_summary, comparison_summary, share_url, language, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(invite_id) DO UPDATE SET
      installation_id = excluded.installation_id,
      user_id = excluded.user_id,
      source = excluded.source,
      target_tab = excluded.target_tab,
      inviter_name = excluded.inviter_name,
      preview_title = excluded.preview_title,
      preview_summary = excluded.preview_summary,
      comparison_summary = excluded.comparison_summary,
      share_url = excluded.share_url,
      language = excluded.language,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at
  `).run(
    normalized.inviteId,
    normalized.installationId || identity.installationId || null,
    normalized.userId || identity.userId || null,
    normalized.source,
    normalized.targetTab,
    normalized.inviterName,
    normalized.previewTitle,
    normalized.previewSummary,
    normalized.comparisonSummary,
    normalized.shareUrl,
    normalized.language,
    normalized.createdAt,
    normalized.updatedAt,
  );
  return normalized;
};

export function createShareMetadataStore(dbPath) {
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

  return {
    async getMetadata(inviteId) {
      return withMutation(() => loadMetadata(db, inviteId));
    },
    async upsertMetadata(identity, metadata) {
      return withMutation(() => persistMetadata(db, identity, metadata));
    },
  };
}
