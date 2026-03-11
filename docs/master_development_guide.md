0. 요약

프로젝트명: Sazoo v2.1 (Forest)

핵심 콘셉트: 힐링 & 신비 콘셉트의 AI 사주 플랫폼

목표: 단순 텍스트 사주를 넘어 몰입형 3D + AI 상담 제공

플랫폼: 웹(PWA) → 네이티브 확장 가능

1. 제품 비전 & 기능
핵심 가치

고품질 3D 기반 몰입 경험

일일 에너지 밸런스와 운 주기까지 반영한 초개인화

정적인 운세가 아닌 대화형 인생 상담

주요 기능 상태

운명 분석 온보딩: 완료

홈 성소 3D 씬: 완료

AI 사주 마스터: 준비 완료

미니 앱: 일부 진행

경제 시스템(엽전): 프론트엔드만 구현

2. 기술 아키텍처 (목표)
A. 프론트엔드

React + TypeScript

Context + API 서비스 레이어

R3F + Drei

Draco/KTX2 압축

Vercel 또는 CloudFront 배포

B. 백엔드 (구축 예정)

Node.js(NestJS/Express) 또는 FastAPI

PostgreSQL + Redis

OAuth 2.0 (카카오/애플/구글)

Gemini API 프록시 서버

C. 인프라

CI/CD: GitHub Actions

모니터링: Sentry, GA4

CDN: Cloudflare

3. 개발 로드맵

Phase 1: 프론트엔드 완성

Phase 2: 실제 백엔드 구축 (2~4주)

Phase 3: 수익화 & 리텐션

Phase 4: 출시 및 라이브 운영

4. 수익화 전략

엽전(코인) 기반 프리미엄 구조

구독제(Sazoo Premium): 월 4,900원

5. 배포 체크리스트

API 키 보안

Lighthouse 90+

개인정보처리방침/약관

아이콘 및 스토어 이미지 준비











# Sazoo v2.1 (Forest) - Master Development & Deployment Guide

## 0. Executive Summary
**Project Name**: Sazoo v2.1 (Forest)
**Core Concept**: A premium, "Healing & Mystical" AI-powered Saju (Korean Fortune Telling) platform.
**Goal**: To move beyond simple text-based fortune telling by providing immersive 3D visuals, calming aesthetics, and deeply personalized AI counseling.
**Platform**: Web (PWA) initially, with potential for Native encapsulation (WebView).

---

## 1. Product Vision & Features

### Core Value Proposition
1.  **Immersive Experience**: High-quality 3D assets (Hanok, Nature) replace static text.
2.  **Hyper-Personalization**: AI analyzes not just static fate, but daily "Energy Balance" and "Luck Cycles".
3.  **Conversational Counseling**: Unlike static fortune apps, "Saju Master" (Chat) offers interactive life advice based on Saju data.

### Key Feature Specifications
| Feature | Details | Status |
| :--- | :--- | :--- |
| **Destiny Analysis** | Onboarding with precise birth time/date. Animated "Analyzing" sequence. | ✅ Prototype Complete |
| **Home Sanctuary** | 3D Interactive Scene. Dynamic stats (Energy/Luck). Scene customization (Unlockable models). | ✅ Prototype Complete |
| **AI Saju Master** | Chatbot context-aware of user's Saju. Uses Gemini 1.5. | ✅ Prototype Ready |
| **Mini Apps** | Fortune Cookie, Tarot (Planned), Amulet creation. | 🚧 Partial |
| **Economy** | "Yeopjeon" (Coins) currency. Uses for Chat/Unlocking Scenes. Earn via Daily Login/Ads. | 🚧 Frontend Only |

---

## 2. Technical Architecture (Target)

To support a scalable, secure, and monetizable application, we must transition from the current "Client-Side Only" prototype to a "Client-Server" architecture.

### A. Frontend (Client)
- **Framework**: React (Vite) + TypeScript.
- **State Management**: React Context + Service Layer (Abstracted API).
- **3D Engine**: React Three Fiber (R3F) + Drei.
- **Optimization**: All 3D assets compressed (Draco + KTX2) for mobile performance.
- **Deployment**: Vercel or AWS CloudFront (Static Hosting).

### B. Backend (Server) - *To Be Built*
- **Runtime**: Node.js (NestJS or Express) OR Python (FastAPI).
- **Database**: 
  - **Primary**: PostgreSQL (User Data, Wallet Ledger, Purchase History).
  - **Cache**: Redis (Session management, Daily Fortune caching).
- **Authentication**: OAuth 2.0 (Kakao, Apple, Google).
- **AI Gateway**: A proxy server to safely manage `GEMINI_API_KEY` and inject "System Prompts" dynamically without exposing them to the client.

### C. Infrastructure & DevOps
- **CI/CD**: GitHub Actions (Auto-deploy to Staging/Prod).
- **Monitoring**: Sentry (Error Tracking), Google Analytics 4 (User Behavior).
- **CDN**: Cloudflare (DDOS Protection + Asset Caching).

---

## 3. Development Roadmap (Phased approach)

### Phase 1: Foundation (Current Status)
- [x] High-fidelity UI/UX implementation.
- [x] 3D Asset Optimization (Draco/KTX2).
- [x] Basic Logic (Saju Calculation Algorithm).
- [x] **Frontend Refactor**: Abstracted Data Layer (`services/api.ts`).

### Phase 2: The "Real" Backend (Next 2-4 Weeks)
1.  **Set up DB**: Design Schema (Users, Transactions, ChatLogs).
2.  **Auth Implementation**: Replace local onboarding with Kakao Login.
3.  **Secure AI**: Move Gemini calls from Frontend -> Backend.
4.  **Wallet Sync**: Verify coin usage on server-side to prevent cheating.

### Phase 3: Monetization & Retention (Weeks 5-6)
1.  **Ad Integration**: Google AdMob (if native) or AdSense/Custom (Web).
2.  **In-App Purchases (IAP)**: Integrate Payment Gateway (Toss Payments / Iamport) or App Store IAP.
3.  **Push Notifications**: Daily Fortune reminders (FCM).

### Phase 4: Launch & Operations (Week 8+)
1.  **Beta Testing**: Closed beta with 100 users for load testing.
2.  **Store Listing**: Wrap as PWA or use Capacitor/React Native WebView to publish to App Store/Play Store.
3.  **LiveOps**: Weekly content updates (New 3D Scenes, Seasonal Events).

---

## 4. Monetization Strategy

### 1. Freemium Economy (Coins / Yeopjeon)
- **Sink (Spending)**:
  - Chatting with Master (1 coin/msg).
  - Unlocking Premium 3D Scenes (e.g., 50 coins).
- **Source (Earning)**:
  - Daily Login (+5 coins).
  - Watch Ad (+3 coins).
  - **Purchase**: 1000 KRW = 50 coins.

### 2. Subscription (Sazoo Premium)
- **Benefits**: Unlimited Chat, Exclusive "Golden" 3D Themes, Detailed 10-year Analysis Report.
- **Price**: ~4,900 KRW / month.

---

## 5. Deployment Checklist

### Pre-Deployment
- [ ] **Security Audit**: Ensure no API keys are in Frontend code.
- [ ] **Performance**: LightHouse Score > 90 (Performance, SEO).
- [ ] **Legal**: Privacy Policy (v2.1) & Terms of Service written.
- [ ] **Assets**: App Icon (512x512, 1024x1024) & Store Screenshots prepared.

### Production Environment
- **Domain**: `www.sazoo.com` (Example) linked via Cloudflare.
- **SSL**: Https forced.
- **Backup**: Daily DB snapshots.

---

*This document serves as the "North Star" for the Sazoo project. All technical decisions should align with the structure defined in Section 2.*
