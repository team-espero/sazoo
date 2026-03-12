import { createPostgresDatabase, fromJson } from '../db/postgres.js';
import { buildAnalyticsReport } from './summary.js';

const normalizeEventRecord = (rawEvent, receivedAt) => {
  const event = fromJson(rawEvent, null);

  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return null;
  }

  const fallbackTimestamp =
    typeof receivedAt === 'string' && receivedAt.trim()
      ? receivedAt
      : new Date().toISOString();

  const name =
    typeof event.name === 'string' && event.name.trim()
      ? event.name.trim()
      : 'unknown';

  const payload =
    event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload)
      ? event.payload
      : {};

  const timestamp =
    typeof event.timestamp === 'string' && event.timestamp.trim()
      ? event.timestamp
      : typeof event.receivedAt === 'string' && event.receivedAt.trim()
        ? event.receivedAt
        : fallbackTimestamp;

  return {
    ...event,
    name,
    payload,
    timestamp,
    receivedAt: timestamp,
  };
};

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

      const events = rows
        .map((row) => normalizeEventRecord(row.event_json, row.received_at))
        .filter(Boolean);
      return buildAnalyticsReport(events);
    },
  };
}
