Phase 1: 백엔드 구현

JWT 인증

사용자/코인/채팅 API

Gemini API 키 보호 프록시

결제 검증(IAP)

Phase 2: 프론트엔드 연동

소셜 로그인 전환

localStorage → API

사주 로직 클라이언트 유지 권장

에러/분석 도구 연동

Phase 3: 배포

프론트: Vercel/Netlify

백엔드: AWS/GCP

CDN 설정

환경 변수 분리

전체 작업 요약

백엔드 인증 & DB

AI 보안 프록시

코인 원장

프론트 API 전환

인프라 & CDN

# Sazoo v2.1 - Launch Technical Roadmap

This document outlines the necessary steps to transition Sazoo from a local prototype to a production-ready application.

## Phase 1: Backend Implementation (The Engine)

Currently, the app relies on `localStorage` and client-side API calls. For a real launch, you need a server.

### 1. API & Server Architecture
- **Framework**: Node.js (Express/NestJS) or Python (FastAPI/Django).
- **Authentication**: JWT Based Auth.
- **endpoints**:
  - `POST /auth/login`: Social Login (Kakao, Google, Apple).
  - `GET /user/profile`: Fetch user Saju data.
  - `POST /user/profile`: Update birth data.
  - `GET /user/coins`: Get current coin balance.
  - `POST /chat/completions`: Proxy for Gemini API (Hides API Key).

### 2. Database Schema (PostgreSQL/MongoDB)
- **Users Table**:
  - `id` (UUID)
  - `oauth_provider` (kakao/google)
  - `saju_data` (JSON: birth_date, time, etc.)
  - `created_at`
- **Wallet Table**:
  - `user_id`
  - `balance` (Integer)
  - `free_coins_claimed_at` (Timestamp for daily reset)
- **ChatHistory Table** (Optional, for syncing across devices):
  - `user_id`
  - `message_log` (JSON)
- **Unlocks Table**:
  - `user_id`
  - `unlocked_items` (Array of IDs: e.g., ['woman', 'moon_rabbit'])

### 3. AI Proxy Server protection
- **Problem**: Currently, the Gemini API key is exposed in the frontend code.
- **Solution**: Move `GoogleGenAI` calls to the backend.
  - Frontend sends user message -> Backend appends System Prompt & Saju Context -> Backend calls Gemini -> Returns response to Frontend.

### 4. Payments (In-App Purchases)
- **Apple/Google IAP Verification**:
  - Implement server-side receipt validation for coin purchases.

---

## Phase 2: Frontend Integration (The Connection)

Steps to connect the React app to the new Backend.

### 1. Authentication Layer
- Replace "Name Input" onboarding with **Social Login** (Kakao SDK / Google Sign-in).
- Create an `AuthProvider` context to handle JWT tokens.
- Add "Guest Mode" vs "Logged In Mode".

### 2. API Client Replacement
- Replace `localStorage` reads/writes in `context.tsx` with `fetch` or `axios` calls to your backend.
- **Example**:
  ```typescript
  // Old
  const saveCoins = (coins) => localStorage.setItem('coins', coins);
  
  // New
  const saveCoins = async (coins) => {
    await api.post('/user/coins', { amount: coins });
  }
  ```

### 3. Saju Logic Migration (Optional but Recommended)
- Currently, `saju.js` (the library calculating stems/branches) runs on the client.
- **Option A**: Keep it on client (Cheaper, faster UI).
- **Option B**: Move to backend (More secure, consistent logic updates). *Recommendation: Keep on client for v1 unless logic is proprietary.*

### 4. Error Handling & Analytics
- **Error Boundaries**: Add Global Error Boundary for crash reporting (Sentry).
- **Analytics**: Integrate Google Analytics / Amplitude to track:
  - Drop-off rate during onboarding.
  - Most popular 3D scenes.
  - Average chat length.

### 5. Deployment Checklist
- **Hosting**: Vercel/Netlify (Frontend), AWS/GCP (Backend).
- **CDN**: Configure CloudFront/Cloudflare for caching large assets (GLB files, Videos).
- **Environment Variables**: Ensure `VITE_API_URL` is set correctly for Dev/Staging/Prod.

---

## Summary of Work Required
| Category | Task |
| :--- | :--- |
| **Backend** | Set up Auth/User DB |
| **Backend** | Create Secure AI Proxy Endpoint |
| **Backend** | Implement Coin Ledger & IAP Verification |
| **Frontend** | Integrate Social Login (Kakao/Google) |
| **Frontend** | Connect to Backend APIs (remove localStorage) |
| **Infra** | Set up S3/CDN for 3D Assets (Optional but good for scale) |
