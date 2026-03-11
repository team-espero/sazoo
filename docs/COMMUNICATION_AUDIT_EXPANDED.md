# Sazoo Communication Audit (Expanded)

- Generated: 2026-03-09
- Scope: Runtime code scan for `server`, `src`, `screens`, `components`, `context.tsx`, env/config files
- Excluded: `node_modules`, build artifacts

## Summary

- Frontend communicates with **internal API**: `/api/v1/fortune/chat`, `/api/v1/fortune/daily-insights`
- Backend communicates with **external LLM API**: Google Gemini via `@google/genai`
- Frontend also calls external **image/avatar CDNs** (DiceBear, i.ibb, grainy-gradients)
- Firebase SDK / Firestore / Firebase Auth usage: **Not found**

---

## 1) External API Communication

| 기능 목적 | 사용된 외부 서비스 | 요청 방식(Method) | 주요 요청 값(Request) | 주요 응답 값(Response) | 작성된 파일 경로 |
|---|---|---|---|---|---|
| 운세 채팅 생성 | Google Gemini (`@google/genai`) | SDK call (`generateContent`, HTTPS) | `model=chatModel`, prompt includes `language`, `profile`, `saju`, `message`, `isInitialAnalysis` | `result.text` -> normalized to `{ "reply": string }` | `server/ai/geminiProvider.js` |
| 일일 인사이트 생성 | Google Gemini (`@google/genai`) | SDK call (`generateContent`, HTTPS) | `model=insightsModel`, prompt includes `language`, `date`, `profile`, `saju` + JSON schema instruction | Parsed JSON: `luckyItems[]`, `sajuTip`, `elementTip`, `energyTip`, `cycleTip` | `server/ai/geminiProvider.js`, `server/schemas/fortuneSchemas.js` |
| 미니앱/프로필 아바타 렌더링 | DiceBear Avatar API | GET | `https://api.dicebear.com/7.x/notionists/svg?seed=<name>` / `.../avataaars/svg?seed=<name>&backgroundColor=b6e3f4` | SVG avatar image | `screens/tabs/MiniAppsScreen.tsx`, `screens/tabs/ProfileScreen.tsx` |
| 온보딩 대표 이미지 로드 | i.ibb (image host) | GET | Fixed PNG URL | PNG image | `screens/OnboardingScreen.tsx` |
| 배경 노이즈 텍스처 로드 | grainy-gradients | GET | Fixed SVG URL | SVG image | `components/BackgroundLayout.tsx` |

---

## 2) Internal API Communication (Internal Server / API)

| 기능 목적 | API 엔드포인트(URL) | 요청 방식(Method) | 주요 파라미터 | 작성된 파일 경로 |
|---|---|---|---|---|
| 채팅 운세 응답 | `/api/v1/fortune/chat` | POST | `message`, `language`, `profile?`, `saju?`, `isInitialAnalysis?` | Client: `src/services/api.ts`, `screens/tabs/ChatScreen.tsx`, `screens/tabs/MiniAppsScreen.tsx` / Server: `server/app.js`, `server/schemas/fortuneSchemas.js` |
| 홈 탭 일일 인사이트 생성 | `/api/v1/fortune/daily-insights` | POST | `language`, `date?`, `profile?`, `saju?` | Client: `src/services/api.ts`, `context.tsx`, `screens/tabs/HomeTab.tsx` / Server: `server/app.js`, `server/schemas/fortuneSchemas.js` |
| 서버 헬스체크 | `/health` | GET | 없음 | `server/app.js` |
| 개발환경 프록시 | `/api/v1/*` -> `http://localhost:8787` | Vite Proxy | 경로/바디 그대로 전달 | `vite.config.ts` |

### Internal API Contract Details

#### `POST /api/v1/fortune/chat`

Request (schema):

```json
{
  "message": "string (1..1500)",
  "language": "en | ko | ja",
  "profile": "any (optional)",
  "saju": "any (optional)",
  "isInitialAnalysis": "boolean (optional)"
}
```

Response (schema):

```json
{
  "data": {
    "reply": "string (1..5000)"
  }
}
```

Error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR | RATE_LIMITED | UPSTREAM_INVALID_PAYLOAD | SERVER_ERROR | ...",
    "message": "string",
    "details": "optional"
  }
}
```

#### `POST /api/v1/fortune/daily-insights`

Request (schema):

```json
{
  "language": "en | ko | ja",
  "date": "string (optional)",
  "profile": "any (optional)",
  "saju": "any (optional)"
}
```

Response (schema):

```json
{
  "data": {
    "luckyItems": [
      { "emoji": "string", "name": "string", "type": "string" }
    ],
    "sajuTip": "string",
    "elementTip": "string",
    "energyTip": "string",
    "cycleTip": "string"
  }
}
```

---

## 3) Firebase SDK Communication (BaaS)

| 기능 목적 | Firestore 컬렉션/문서 경로 또는 Auth 기능 | 수행 작업(Read/Write/Update/Delete) | 저장/불러오는 주요 데이터 형태 | 작성된 파일 경로 |
|---|---|---|---|---|
| Firebase/Firestore/Auth 연동 | 사용 없음 | 없음 | 없음 | 프로젝트 런타임 코드 전반(`server`, `src`, `screens`, `components`) 스캔 결과 미발견 |

---

## Additional: Client-side Local Storage (Non-network)

> 요청하신 3개 카테고리 외에, 실제 데이터 지속성 관점에서 중요한 로컬 저장도 함께 기재합니다.

| 기능 목적 | 저장소 | 수행 작업 | 주요 데이터 형태 | 작성된 파일 경로 |
|---|---|---|---|---|
| 프로필/활성 프로필/코인/일일인사이트 저장 | `localStorage` | Read/Write/Remove/Clear | `saju`, `activeProfileId`, `sazoo_coins`, `daily_insights`, 앱 설정값 | `src/services/storage.ts`, `src/services/api.ts`, `context.tsx` |

---

## End-to-End Data Flow

1. Frontend UI (`ChatScreen`, `MiniAppsScreen`, `HomeTab`) calls `api.ai.chat()` / `api.ai.generateDailyInsights()`.
2. `src/services/api.ts` builds URL using `clientEnv.apiBaseUrl` and sends `fetch` POST.
3. Express server validates payload with Zod schemas.
4. Server calls Gemini model via `GoogleGenAI().models.generateContent(...)`.
5. Server normalizes/parses model output and returns JSON envelope `{ data: ... }`.
6. Frontend renders response and 일부 데이터는 localStorage에 저장.

---

## Security Warnings (Must-fix)

### 1) Sensitive key material in local env file

- `.env.local` contains:
  - `VITE_GEMINI_API_KEY=...`
  - `VITE_GEMINI_PROJECT_ID=...`
  - `VITE_GEMINI_PROJECT_NUMBER=...`
- Risk:
  - `VITE_*` keys are client-exposed by design.
  - Even if currently unused in runtime code, accidental usage or leakage risk is high.
- Action:
  - Rotate key immediately.
  - Remove client-side Gemini key entirely.
  - Keep LLM key server-side only (`GEMINI_API_KEY` in backend env).

### 2) Internal API has no auth/identity boundary

- `/api/v1/fortune/chat`, `/api/v1/fortune/daily-insights` are callable without user auth token validation.
- Current protections are rate-limit + CORS only, which are not identity/auth controls.
- Action:
  - Add authentication (JWT/session/API gateway auth).
  - Add per-user quota and abuse controls.

### 3) PII-like payload is sent to external model

- Prompt includes serialized `profile`, `saju`, and user `message`.
- Action:
  - Minimize fields before forwarding.
  - Add consent/retention policy and masking strategy.
  - Add server-side audit logging policy (without raw sensitive text where possible).

### 4) Plaintext local storage of user profile/birth data

- Profile and birth-date related data are persisted in `localStorage`.
- Action:
  - Consider encrypted storage strategy and strict XSS hardening.
  - Separate sensitive vs non-sensitive persistence.

---

## Evidence (Key Code Pointers)

- Internal API client call: `src/services/api.ts` (`postJson`, `fetch`, `/fortune/chat`, `/fortune/daily-insights`)
- Internal API server routes: `server/app.js`
- External LLM integration: `server/ai/geminiProvider.js`
- Request/response schema: `server/schemas/fortuneSchemas.js`
- Runtime env + API base URL: `src/config/env.ts`, `server/env.js`, `vite.config.ts`
- External image/avatar calls:
  - `screens/tabs/MiniAppsScreen.tsx`
  - `screens/tabs/ProfileScreen.tsx`
  - `screens/OnboardingScreen.tsx`
  - `components/BackgroundLayout.tsx`

