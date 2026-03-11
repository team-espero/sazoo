# 03 Security Boundary

## Objective
클라이언트에서 LLM API 키를 직접 사용하지 않고, 서버 API relay 경계를 강제한다.

## Changes
1. Frontend direct key usage removed
- Updated: `context.tsx`
- Updated: `screens/tabs/ChatScreen.tsx`
- Updated: `screens/tabs/MiniAppsScreen.tsx`

2. Server relay introduced
- Added: `server/app.js`
- Added: `server/ai/geminiProvider.js`
- Added: `server/schemas/fortuneSchemas.js`
- Added: `server/env.js`
- Added: `server/index.js`

3. API contract defined
- Added: `docs/api/openapi.yaml`

## Boundary Rules
- Browser -> `/api/v1/fortune/*`
- Server -> Gemini API
- Secret key (`GEMINI_API_KEY`) is server-only env

## Verification
1. Frontend source secret scan
- Command: `npm run lint`
- Result: PASS (`Secret lint passed.`)

2. Built bundle secret scan (text assets)
- Scope: `C:/temp/sazoo-dist/*.js|*.css|*.html|*.json`
- Pattern: `GEMINI_API_KEY|VITE_GEMINI_API_KEY|AIza`
- Result: `0` matches

## Remaining Note
- `.env.local`에 기존 `VITE_GEMINI_API_KEY` 값이 남아 있으나, 클라이언트 코드에서 더 이상 참조하지 않음.
