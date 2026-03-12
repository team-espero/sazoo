import { createPostgresDatabase } from '../db/postgres.js';
import { getOwnerKeys, getPrimaryOwnerKey, getUserKey } from '../db/identity.js';

const normalizeIdentityRecord = (value) => ({
  provider: value?.provider === 'kakao' ? 'kakao' : 'google',
  providerAccountId: String(value?.providerAccountId || '').trim(),
  displayName: value?.displayName ? String(value.displayName).trim().slice(0, 160) : null,
  email: value?.email ? String(value.email).trim().slice(0, 320) : null,
  photoURL: value?.photoURL ? String(value.photoURL).trim().slice(0, 2048) : null,
  lastLoginAt: String(value?.lastLoginAt || new Date().toISOString()),
  updatedAt: new Date().toISOString(),
});

export function createAuthIdentityStore(databaseUrl) {
  const db = createPostgresDatabase(databaseUrl);
  const ready = db.query(`
    CREATE TABLE IF NOT EXISTS auth_identity_records (
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      owner_key TEXT NOT NULL,
      installation_id TEXT,
      user_id TEXT,
      display_name TEXT,
      email TEXT,
      photo_url TEXT,
      last_login_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (provider, provider_account_id)
    )
  `);

  const listByOwner = async (executor, ownerKey) => {
    const { rows } = await executor.query(
      `
        SELECT provider, provider_account_id, display_name, email, photo_url, last_login_at, updated_at
        FROM auth_identity_records
        WHERE owner_key = $1
        ORDER BY updated_at DESC
      `,
      [ownerKey],
    );
    return rows.map((row) => ({
      provider: row.provider,
      providerAccountId: row.provider_account_id,
      displayName: row.display_name,
      email: row.email,
      photoURL: row.photo_url,
      lastLoginAt: new Date(row.last_login_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
  };

  const upsertIdentity = async (executor, ownerKey, identity, record) => {
    const normalized = normalizeIdentityRecord(record);
    await executor.query(
      `
        INSERT INTO auth_identity_records (
          provider, provider_account_id, owner_key, installation_id, user_id,
          display_name, email, photo_url, last_login_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, NOW())
        ON CONFLICT (provider, provider_account_id) DO UPDATE SET
          owner_key = EXCLUDED.owner_key,
          installation_id = EXCLUDED.installation_id,
          user_id = EXCLUDED.user_id,
          display_name = EXCLUDED.display_name,
          email = EXCLUDED.email,
          photo_url = EXCLUDED.photo_url,
          last_login_at = EXCLUDED.last_login_at,
          updated_at = NOW()
      `,
      [
        normalized.provider,
        normalized.providerAccountId,
        ownerKey,
        identity.installationId || null,
        identity.userId || null,
        normalized.displayName,
        normalized.email,
        normalized.photoURL,
        normalized.lastLoginAt,
      ],
    );
    return normalized;
  };

  return {
    async listIdentities(identity) {
      await ready;
      return db.withTransaction(async (client) => {
        const seen = new Map();
        for (const ownerKey of getOwnerKeys(identity).slice().reverse()) {
          for (const record of await listByOwner(client, ownerKey)) {
            seen.set(`${record.provider}:${record.providerAccountId}`, record);
          }
        }
        return [...seen.values()].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
      });
    },
    async upsertIdentity(identity, record) {
      await ready;
      return db.withTransaction(async (client) => {
        const normalized = normalizeIdentityRecord(record);
        for (const ownerKey of getOwnerKeys(identity)) {
          await upsertIdentity(client, ownerKey, identity, normalized);
        }
        return normalized;
      });
    },
    async promoteToUser(identity) {
      await ready;
      if (!identity?.userId) return [];
      return db.withTransaction(async (client) => {
        const userKey = getUserKey(identity.userId);
        const records = [
          ...(await listByOwner(client, getPrimaryOwnerKey(identity))),
          ...(await listByOwner(client, userKey)),
        ];
        for (const record of records) {
          await upsertIdentity(client, userKey, identity, record);
        }
        return listByOwner(client, userKey);
      });
    },
  };
}
