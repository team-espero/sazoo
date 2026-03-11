# 04 Backend Setup

## Implemented Backend
- Entry: `server/index.js`
- App factory: `server/app.js`
- Env validation: `server/env.js`
- AI relay: `server/ai/geminiProvider.js`
- Request/response schemas: `server/schemas/fortuneSchemas.js`

## Features
1. Input validation
- `zod` schema validation for chat and daily insights endpoints

2. Rate limiting
- `express-rate-limit` applied on `/api/v1/fortune/*`

3. Security headers + CORS
- `helmet` + restricted CORS origins from env

4. Error envelope
- Unified error response with `error.code` and `error.message`

## Endpoints
- `GET /health`
- `POST /api/v1/fortune/chat`
- `POST /api/v1/fortune/daily-insights`

## Local Run
1. `npm run server:start`
2. `npm run dev`

## Smoke Test (Executed)
- Health check: `health=ok`
- Chat relay: `chatStatus=200`, `replyLen=156`
- Daily insights relay: `insightsStatus=200`, `luckyItems=3`

## Env
- Updated: `.env.example`
- Added: `.env.staging.example`
- Added: `.env.production.example`
