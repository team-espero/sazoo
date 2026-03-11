# 06 Environment Strategy

## Goal
dev/staging/prod를 분리하고, 누락/오류 env를 애플리케이션 시작 단계에서 fail-fast 처리한다.

## Frontend
- File: `src/config/env.ts`
- Required/validated:
  - `VITE_APP_ENV` (`dev|staging|prod`)
  - `VITE_API_BASE_URL`
  - `VITE_API_TIMEOUT_MS`

## Backend
- File: `server/env.js`
- Required/validated:
  - `GEMINI_API_KEY`
  - `API_PREFIX`, `PORT`, `CORS_ORIGINS`, rate-limit options

## Env Templates
- `.env.example`
- `.env.staging.example`
- `.env.production.example`

## Fail-Fast Behavior
- Invalid env => throws `Invalid client environment` or `Invalid server environment` before runtime handling.
- Covered by tests in `server/env.test.ts`

## Commands
- Dev: `npm run dev` + `npm run server:start`
- Staging build: `npm run build:staging`
- Production build: `npm run build:prod`
