import { mkdir, appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const safeParseLine = (line) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
};

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

export function createEventStore(logPath) {
  const resolvedPath = path.resolve(logPath);
  const directory = path.dirname(resolvedPath);

  return {
    async append(event) {
      await mkdir(directory, { recursive: true });
      await appendFile(resolvedPath, `${JSON.stringify(event)}\n`, 'utf8');
    },
    async summarize() {
      let raw = '';
      try {
        raw = await readFile(resolvedPath, 'utf8');
      } catch (error) {
        if (error && error.code === 'ENOENT') {
          return emptyReport();
        }
        throw error;
      }

      const lines = raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const events = lines.map(safeParseLine).filter(Boolean);

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
