import { createPostgresDatabase, fromJson } from '../db/postgres.js';

const emptyReport = () => ({
  generatedAt: new Date().toISOString(),
  totalEvents: 0,
  counts: {
    share: 0,
    invite_open: 0,
    install_from_invite: 0,
    d1_retention: 0,
    invite_reward_claimed: 0,
    invite_reward_duplicate: 0,
    invite_reward_claim_failed: 0,
    first_reading_success: 0,
    first_reading_failure: 0,
  },
  timeToFirstValue: {
    samples: 0,
    averageMs: 0,
    withinTargetCount: 0,
    withinTargetRate: 0,
  },
  recentEvents: [],
});

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
      const report = emptyReport();
      report.generatedAt = new Date().toISOString();
      report.totalEvents = events.length;

      let timeToFirstValueTotal = 0;

      for (const event of events) {
        if (report.counts[event.name] !== undefined) {
          report.counts[event.name] += 1;
        }

        if (event.name === 'time_to_first_value') {
          const durationMs = Number(event?.payload?.durationMs || 0);
          const withinTarget = Boolean(event?.payload?.withinTarget);
          report.timeToFirstValue.samples += 1;
          report.timeToFirstValue.withinTargetCount += withinTarget ? 1 : 0;
          timeToFirstValueTotal += durationMs;
        }
      }

      if (report.timeToFirstValue.samples > 0) {
        report.timeToFirstValue.averageMs = Math.round(timeToFirstValueTotal / report.timeToFirstValue.samples);
        report.timeToFirstValue.withinTargetRate = Number(
          (report.timeToFirstValue.withinTargetCount / report.timeToFirstValue.samples).toFixed(2),
        );
      }

      report.recentEvents = events
        .slice(-12)
        .reverse()
        .map((event) => ({
          name: event.name,
          timestamp: event.timestamp || event.receivedAt || '',
          payload: event.payload || {},
        }));

      return report;
    },
  };
}
