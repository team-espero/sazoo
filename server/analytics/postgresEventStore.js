import { createPostgresDatabase, fromJson } from '../db/postgres.js';
import { buildAnalyticsReport } from './summary.js';

export function createPostgresEventStore(databaseUrl) {
  const db = createPostgresDatabase(databaseUrl);
  const ready = db.query(`
    CREATE TABLE IF NOT EXISTS client_event_records (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      event_json JSONB NOT NULL,
      received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  return {
    async append(event) {
      await ready;
      await db.query(
        'INSERT INTO client_event_records (name, event_json) VALUES ($1, $2::jsonb)',
        [String(event?.name || 'unknown'), JSON.stringify(event)],
      );
    },
    async summarize() {
      await ready;
      const { rows } = await db.query(
        `
          SELECT event_json, received_at
          FROM client_event_records
          ORDER BY id ASC
        `,
      );

      const events = rows.map((row) => fromJson(row.event_json, null)).filter(Boolean);
      return buildAnalyticsReport(events);
    },
  };
}
