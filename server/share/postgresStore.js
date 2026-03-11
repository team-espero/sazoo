import { createPostgresDatabase } from '../db/postgres.js';

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

export function createShareMetadataStore(databaseUrl) {
  const db = createPostgresDatabase(databaseUrl);
  const ready = db.query(`
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
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  return {
    async getMetadata(inviteId) {
      await ready;
      const { rows } = await db.query(
        `
          SELECT invite_id, installation_id, user_id, source, target_tab, inviter_name, preview_title, preview_summary,
                 comparison_summary, share_url, language, created_at, updated_at
          FROM share_metadata_records
          WHERE invite_id = $1
        `,
        [inviteId],
      );
      if (!rows[0]) return null;
      return normalizeMetadata({
        inviteId: rows[0].invite_id,
        installationId: rows[0].installation_id || undefined,
        userId: rows[0].user_id || undefined,
        source: rows[0].source,
        targetTab: rows[0].target_tab,
        inviterName: rows[0].inviter_name,
        previewTitle: rows[0].preview_title,
        previewSummary: rows[0].preview_summary,
        comparisonSummary: rows[0].comparison_summary,
        shareUrl: rows[0].share_url,
        language: rows[0].language,
        createdAt: new Date(rows[0].created_at).toISOString(),
        updatedAt: new Date(rows[0].updated_at).toISOString(),
      });
    },
    async upsertMetadata(identity, metadata) {
      await ready;
      const normalized = normalizeMetadata(metadata);
      await db.query(
        `
          INSERT INTO share_metadata_records (
            invite_id, installation_id, user_id, source, target_tab, inviter_name,
            preview_title, preview_summary, comparison_summary, share_url, language, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::timestamptz, NOW())
          ON CONFLICT (invite_id) DO UPDATE SET
            installation_id = EXCLUDED.installation_id,
            user_id = EXCLUDED.user_id,
            source = EXCLUDED.source,
            target_tab = EXCLUDED.target_tab,
            inviter_name = EXCLUDED.inviter_name,
            preview_title = EXCLUDED.preview_title,
            preview_summary = EXCLUDED.preview_summary,
            comparison_summary = EXCLUDED.comparison_summary,
            share_url = EXCLUDED.share_url,
            language = EXCLUDED.language,
            created_at = EXCLUDED.created_at,
            updated_at = NOW()
        `,
        [
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
        ],
      );
      return normalized;
    },
  };
}
