# 05 Frontend Integration

## Summary
프론트 AI 호출을 API 레이어(`src/services/api.ts`)로 통합하고, 실패 UX를 API 에러 코드 기준으로 일관 처리했다.

## Changes
1. API service layer
- Added: `src/config/env.ts`
- Rewritten: `src/services/api.ts`
  - `api.ai.chat(...)`
  - `api.ai.generateDailyInsights(...)`
  - `ApiError` class

2. Context integration
- Updated: `context.tsx`
  - `generateDailyInsights` now uses backend relay

3. Chat integration
- Updated: `screens/tabs/ChatScreen.tsx`
  - direct Gemini call removed
  - localized fallback via `ApiError` code mapping

4. Mini apps integration
- Updated: `screens/tabs/MiniAppsScreen.tsx`
  - direct Gemini call removed
  - compatibility/dream flows now call backend relay

## Request Flow
1. UI event
2. `src/services/api.ts` POST request
3. `server/app.js` validation/rate-limit
4. `server/ai/geminiProvider.js`
5. response envelope -> UI state update

## Manual Scenarios
- Success: chat/insights both 200
- Failure: validation error returns `VALIDATION_ERROR`
- Rate limit: returns `RATE_LIMITED` (429)
