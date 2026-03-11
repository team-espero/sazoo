import { openLaunchDatabase } from '../db/launchDb.js';

const getInstallationKey = (installationId) => `installation:${installationId}`;
const getUserKey = (userId) => (userId ? `user:${userId}` : null);
const getOwnerKeys = ({ installationId, userId }) => {
  const keys = [getInstallationKey(installationId)];
  const userKey = getUserKey(userId);
  if (userKey) keys.unshift(userKey);
  return keys;
};

const normalizeIdentityRecord = (value) => ({
  provider: value?.provider === 'kakao' ? 'kakao' : 'google',
  providerAccountId: String(value?.providerAccountId || '').trim(),
  displayName: value?.displayName ? String(value.displayName).trim().slice(0, 160) : null,
  email: value?.email ? String(value.email).trim().slice(0, 320) : null,
  photoURL: value?.photoURL ? String(value.photoURL).trim().slice(0, 2048) : null,
  lastLoginAt: String(value?.lastLoginAt || new Date().toISOString()),
  updatedAt: new Date().toISOString(),
});

const ensureSchema = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_identity_records (
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      owner_key TEXT NOT NULL,
      installation_id TEXT,
      user_id TEXT,
      display_name TEXT,
      email TEXT,
      photo_url TEXT,
      last_login_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (provider, provider_account_id)
    );

    CREATE INDEX IF NOT EXISTS idx_auth_identity_owner_key
      ON auth_identity_records(owner_key, updated_at DESC);

    CREATE INDEX IF NOT EXISTS idx_auth_identity_user_id
      ON auth_identity_records(user_id, updated_at DESC);
  `);
};

const listIdentitiesByOwner = (db, ownerKey) => db.prepare(`
  SELECT provider, provider_account_id, display_name, email, photo_url, last_login_at, updated_at
  FROM auth_identity_records
  WHERE owner_key = ?
  ORDER BY updated_at DESC
`).all(ownerKey).map((row) => ({
  provider: row.provider,
  providerAccountId: row.provider_account_id,
  displayName: row.display_name,
  email: row.email,
  photoURL: row.photo_url,
  lastLoginAt: row.last_login_at,
  updatedAt: row.updated_at,
}));

const persistIdentity = (db, ownerKey, identity, record) => {
  const normalized = normalizeIdentityRecord(record);
  db.prepare(`
    INSERT INTO auth_identity_records (
      provider, provider_account_id, owner_key, installation_id, user_id,
      display_name, email, photo_url, last_login_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(provider, provider_account_id) DO UPDATE SET
      owner_key = excluded.owner_key,
      installation_id = excluded.installation_id,
      user_id = excluded.user_id,
      display_name = excluded.display_name,
      email = excluded.email,
      photo_url = excluded.photo_url,
      last_login_at = excluded.last_login_at,
      updated_at = excluded.updated_at
  `).run(
    normalized.provider,
    normalized.providerAccountId,
    ownerKey,
    identity.installationId || null,
    identity.userId || null,
    normalized.displayName,
    normalized.email,
    normalized.photoURL,
    normalized.lastLoginAt,
    normalized.updatedAt,
  );

  return normalized;
};

export function createAuthIdentityStore(dbPath) {
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
    async listIdentities(identity) {
      return withMutation(() => {
        const seen = new Map();
        for (const ownerKey of getOwnerKeys(identity).slice().reverse()) {
          for (const record of listIdentitiesByOwner(db, ownerKey)) {
            const dedupeKey = `${record.provider}:${record.providerAccountId}`;
            seen.set(dedupeKey, record);
          }
        }
        return [...seen.values()].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
      });
    },
    async upsertIdentity(identity, record) {
      return withMutation(() => {
        const normalized = normalizeIdentityRecord(record);
        for (const ownerKey of getOwnerKeys(identity)) {
          persistIdentity(db, ownerKey, identity, normalized);
        }
        return normalized;
      });
    },
    async promoteToUser(identity) {
      if (!identity?.userId) return [];
      return withMutation(() => {
        const installationKey = getInstallationKey(identity.installationId);
        const userKey = getUserKey(identity.userId);
        const records = [
          ...listIdentitiesByOwner(db, installationKey),
          ...listIdentitiesByOwner(db, userKey),
        ];
        for (const record of records) {
          persistIdentity(db, userKey, identity, record);
          persistIdentity(db, installationKey, identity, record);
        }
        return listIdentitiesByOwner(db, userKey);
      });
    },
  };
}
