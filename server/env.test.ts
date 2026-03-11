import { describe, expect, it } from 'vitest';
import { parseServerEnv } from './env.js';

describe('parseServerEnv', () => {
  it('parses valid input', () => {
    const env = parseServerEnv({
      NODE_ENV: 'production',
      PORT: '8787',
      API_PREFIX: '/api/v1',
      GEMINI_API_KEY: 'abcdefghijklmnopqrstuvwxyz123456',
      GEMINI_CHAT_MODEL: 'gemini-2.5-flash',
      GEMINI_INSIGHTS_MODEL: 'gemini-2.5-flash',
      CORS_ORIGINS: 'http://localhost:5173,https://example.com',
      RATE_LIMIT_WINDOW_MS: '60000',
      RATE_LIMIT_MAX: '20',
      LOG_LEVEL: 'info',
    });

    expect(env.port).toBe(8787);
    expect(env.corsOrigins).toEqual(['http://localhost:5173', 'https://example.com']);
  });

  it('fails fast when api key is missing', () => {
    expect(() =>
      parseServerEnv({
        NODE_ENV: 'development',
        PORT: '8787',
        API_PREFIX: '/api/v1',
        GEMINI_CHAT_MODEL: 'gemini-2.5-flash',
        GEMINI_INSIGHTS_MODEL: 'gemini-2.5-flash',
        CORS_ORIGINS: 'http://localhost:5173',
        RATE_LIMIT_WINDOW_MS: '60000',
        RATE_LIMIT_MAX: '20',
        LOG_LEVEL: 'info',
      } as Record<string, string>),
    ).toThrow('Invalid server environment');
  });
});

