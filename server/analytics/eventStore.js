import { mkdir, appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildAnalyticsReport, emptyAnalyticsReport } from './summary.js';

const safeParseLine = (line) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
};

export function createEventStore(logPath) {
  const resolvedPath = path.resolve(logPath);
  const directory = path.dirname(resolvedPath);

  return {
    async append(event) {
      await mkdir(directory, { recursive: true });
      await appendFile(resolvedPath, `${JSON.stringify(event)}\n`, 'utf8');
    },
    async summarize(options = {}) {
      let raw = '';
      try {
        raw = await readFile(resolvedPath, 'utf8');
      } catch (error) {
        if (error && error.code === 'ENOENT') {
          return emptyAnalyticsReport();
        }
        throw error;
      }

      const lines = raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const events = lines.map(safeParseLine).filter(Boolean);
      return buildAnalyticsReport(events, options);
    },
  };
}
