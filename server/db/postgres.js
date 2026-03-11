import { Pool } from '@neondatabase/serverless';

const toJson = (value) => JSON.stringify(value ?? null);

export const fromJson = (value, fallback) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return value;
};

export function createPostgresDatabase(databaseUrl) {
  const createPool = () =>
    new Pool({
      connectionString: databaseUrl,
      max: 1,
    });

  const withPool = async (handler) => {
    const pool = createPool();
    try {
      return await handler(pool);
    } finally {
      await pool.end();
    }
  };

  return {
    async query(text, params = []) {
      return withPool((pool) => pool.query(text, params));
    },
    async withTransaction(handler) {
      return withPool(async (pool) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await handler(client);
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      });
    },
  };
}

export async function acquireAdvisoryLock(client, lockKey) {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [lockKey]);
}

export async function ensureLaunchKvSchema(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS launch_kv_records (
      namespace TEXT NOT NULL,
      owner_key TEXT NOT NULL,
      entity_key TEXT NOT NULL,
      installation_id TEXT,
      user_id TEXT,
      data_json JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (namespace, owner_key, entity_key)
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_launch_kv_records_owner_updated
      ON launch_kv_records(namespace, owner_key, updated_at DESC)
  `);
}

export async function loadKvRecord(executor, namespace, ownerKey, entityKey) {
  const { rows } = await executor.query(
    `
      SELECT data_json
      FROM launch_kv_records
      WHERE namespace = $1 AND owner_key = $2 AND entity_key = $3
    `,
    [namespace, ownerKey, entityKey],
  );

  return rows[0] ? fromJson(rows[0].data_json, null) : null;
}

export async function listKvRecords(executor, namespace, ownerKey) {
  const { rows } = await executor.query(
    `
      SELECT entity_key, data_json
      FROM launch_kv_records
      WHERE namespace = $1 AND owner_key = $2
      ORDER BY updated_at DESC
    `,
    [namespace, ownerKey],
  );

  return rows.map((row) => ({
    entityKey: row.entity_key,
    data: fromJson(row.data_json, null),
  }));
}

export async function upsertKvRecord(executor, namespace, ownerKey, entityKey, identity, data) {
  await executor.query(
    `
      INSERT INTO launch_kv_records (
        namespace, owner_key, entity_key, installation_id, user_id, data_json, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
      ON CONFLICT (namespace, owner_key, entity_key) DO UPDATE SET
        installation_id = EXCLUDED.installation_id,
        user_id = EXCLUDED.user_id,
        data_json = EXCLUDED.data_json,
        updated_at = NOW()
    `,
    [
      namespace,
      ownerKey,
      entityKey,
      identity.installationId || null,
      identity.userId || null,
      toJson(data),
    ],
  );
}

export async function replaceKvNamespaceRecords(executor, namespace, ownerKey, identity, records) {
  await executor.query(
    'DELETE FROM launch_kv_records WHERE namespace = $1 AND owner_key = $2',
    [namespace, ownerKey],
  );

  for (const record of records) {
    await upsertKvRecord(executor, namespace, ownerKey, record.entityKey, identity, record.data);
  }
}
