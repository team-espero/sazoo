# Sazoo v2.1 (Forest) - Current App Feature & Structure Guide

## 1. App Overview

**Sazoo** is a premium AI saju application built around a calm 3D visual identity, fast first-response fortune reading, and a conversational "Sazoo Master" experience.

This document reflects the **current optimized implementation in the codebase**, not the original concept-only plan.

## 2. Current User Flow

### A. Intro
- `IntroScreen.tsx` plays `public/intro-video.mp4` on first entry.
- If autoplay is blocked, a manual play button is shown.
- Users can skip the intro immediately.

### B. Landing
- `LandingScreen.tsx` uses a looping background video (`public/login_video.mp4`).
- Language can be selected before entering the app.
- Supported UI languages:
  - English
  - Korean
  - Japanese
- Entering the app goes to the main experience with the **Chat tab as default**.

### C. Onboarding
- Onboarding opens as a full-screen modal from the Chat tab.
- Steps currently implemented:
  1. Social connect entry
  2. Name + gender
  3. Primary concern selection
  4. Birth date / birth time input
- Birth input supports both:
  - wheel picker
  - direct numeric input
- Time input supports:
  - known / unknown toggle
  - AM/PM + hour + minute direct input
- Google login is connected through Firebase when config is valid.
- Launch-critical onboarding was shortened by removing the dedicated knowledge-level step.
- `knowledgeLevel` currently defaults to `newbie` and can be refined later through progressive profiling instead of blocking first value.
- Onboarding completion flow:
  - profile is saved
  - saju is calculated locally
  - analyzing video is shown briefly
  - user returns to **Chat**, not Home
  - first reading appears immediately

### D. First Fortune Response
- The app does **not** wait for a long full AI cycle before showing the first result.
- Current structure:
  - a **local first reading** is generated immediately from calculated saju
  - a **Gemini deep reading** is requested in parallel / immediately after
  - the final conversation tone is kept consistent with the Sazoo Master persona
- This was added to keep first-response latency close to a few seconds instead of a long blocking wait.

### E. Share / Invite Flow
- Share cards can include:
  - my result
  - friend result
  - comparison summary
- Share output carries an invite link with a serialized invite payload.
- Invite entry behavior:
  - landing screen shows invite-aware copy
  - pending invite is restored after onboarding or reopen
  - reward is claimed exactly once per invite identity
- Invite claim identity currently prefers:
  - `userId` when Firebase-authenticated
  - `installationId` as fallback when not logged in

## 3. Main Navigation Structure

The current bottom navigation has **5 tabs**:

1. Home
2. Chat
3. Calendar
4. Mini Apps
5. Profile

Before onboarding is complete:
- only Chat is usable
- other tabs are visually locked

## 4. Tab-by-Tab Feature Status

### A. Home Tab

Current implementation:
- Interactive 3D scene at the top
- Scene switcher with unlockable and always-unlocked assets
- Daily insight card
- Lucky items card
- Lucky element card
- Saju grid
- Five-elements balance visualization
- 1-year / 10-year luck cycle timeline
- Pending prompt handoff to Chat

3D scene details:
- Default home scene now uses a **compressed GLB**:
  - `public/sazoo_hanok_web_home_1024.glb`
- Default scene is optimized for fast load:
  - plain `three.js` runtime
  - `GLTFLoader`
  - `OrbitControls`
  - `MeshoptDecoder`
- KTX2 transcoder is loaded only for models that still require it.
- The default scene avoids KTX2 entirely.
- Scene errors fall back to a local retry UI instead of breaking the screen.

Current scene catalog includes:
- Hanok
- Cheomseongdae
- Five elements objects
- 12 zodiac sign assets
- Additional decorative assets
- Some locked assets gated by coin usage

### B. Chat Tab

Current implementation:
- Main persona: **Sazoo Master**
- Tone: mysterious, calm, intimate, practical
- Supports Korean / English / Japanese response shaping
- Uses user profile + calculated saju context
- Includes suggestion chips for common questions
- Chat coin rule currently uses a daily free pool first, then paid coins
- Left-top badge shows the free pool as `current/max`, for example `3/3`
- Paid balance is shown separately beside the free pool when present
- Failed chat requests refund the exact coin source that was consumed
- Idle character / reading layout is preserved

Important behavior:
- first greeting and onboarding invitation are shown before onboarding
- first real reading starts after onboarding completes
- deep reading text is normalized so it continues naturally from the first reading
- broken text / mojibake output is filtered before rendering

### C. Calendar Tab

Current implementation:
- Monthly mansae-style calendar
- Day selection opens a detail bottom sheet
- Daily stem/branch is calculated locally using `calculateSaju`
- Includes:
  - today's energy summary
  - hourly flow chart
  - score cards for wealth / love / health
  - visual element dot markers on dates

This screen is currently **local-calculation driven**, not backed by a remote calendar API.

### D. Mini Apps Tab

Current implementation:
- Entry cards for multiple mini experiences
- Actually implemented or partially implemented:
  - Couple Matching
  - Dream Reading
- Placeholder / not fully productized yet:
  - Tarot
  - Naming

Behavior notes:
- Mini apps use the same coin economy
- Couple Matching uses profile selection and AI-assisted JSON parsing with fallback
- Dream Reading uses AI-assisted interpretation with fallback behavior
- If AI is slow or fails, local fallback output is used

### E. Profile Tab

Current implementation:
- Theme switching
- Notification toggle UI
- Multi-profile switching
- Add / edit extra profiles
- Relation labels for saved people
- Slot upgrade modal for tier expansion
- Special report list for invite-unlocked comparison reports
- Launch metrics report modal backed by the internal analytics collector
- FAQ / Terms menu stubs

Tier model currently exists in app state:
- `FREE`
- `BASIC`
- `PREMIUM`

Slot limits:
- Free: 2
- Basic: 5
- Premium: practically unlimited

## 5. AI Architecture

The current AI flow is **not frontend-direct Gemini**.

### Frontend
- Frontend calls:
  - `/fortune/chat`
  - `/fortune/daily-insights`
- Client wrapper:
  - `src/services/api.ts`
- Includes:
  - timeout handling
  - offline detection
  - 1 retry for retryable failures
  - normalized API error objects

### Backend
- Express server in `server/`
- App factory:
  - `server/app.js`
- Features:
  - CORS
  - Helmet
  - request size limit
  - route-level rate limit
  - health check
  - Zod payload validation

### Gemini Provider
- Provider file:
  - `server/ai/geminiProvider.js`
- Prompt layer files:
  - `server/ai/prompts/promptVersion.js`
  - `server/ai/prompts/layers.js`
  - `server/ai/prompts/chatPrompt.js`
  - `server/ai/prompts/dailyInsightsPrompt.js`
  - `server/ai/prompts/miniApps/couplePrompt.js`
  - `server/ai/prompts/miniApps/dreamPrompt.js`
  - `server/ai/prompts/contextSelection.js`
  - `server/ai/prompts/shared.js`
  - `server/ai/prompts/localFallbacks.js`
- Current model strategy is speed-first:
  - fast path for initial analysis
  - flash-class Gemini models prioritized
  - structured fallback when AI response is slow or malformed
- Current safeguards:
  - response timeout handling
  - broken-character filtering
  - generic opener stripping
  - tone normalization
  - local fallback reading when upstream quality is poor
- Prompt system status:
  - prompt layers are now versioned and split by role
  - mini-app prompts are isolated from the main chat prompt path
  - mini-app usage behavior is intentionally excluded from core long-term memory in the current Phase 4 scope
  - chat prompts inject only selected memory slices, not a raw transcript dump
  - prompt regression tests cover broken characters, multilingual continuation rules, and fallback readability
  - live Gemini QA script validates real model tone, length, and output format
  - `npm run ci:gemini` runs the stricter CI gate for response time, output length, tone continuity, and structured output
  - canonical prompt guide lives in `docs/PROMPT_SYSTEM.md`

## 6. Saju Data & State Management

Global state lives in `context.tsx`.

The provider is split into multiple logical contexts:
- data context
- settings context
- currency context
- actions context

State currently manages:
- active profile
- multiple saved profiles
- onboarding completion
- calculated saju
- daily insights cache
- pending chat messages
- theme
- language
- coin economy
- invite reward state
- launch analytics event cache
- user tier
- progressive profile memory cache

Persistence:
- local storage through `src/services/storage`
- safe persistence wrappers for profile and wallet-like data
- server-backed user state now lives in a durable launch database layer and is mirrored locally for fast boot
- invite-unlocked special reports are also persisted in the same durable database layer and mirrored locally
- chat summaries are stored in the same durable database layer so older guidance can be restored separately from raw chat history
- progressive profile memory is stored separately from chat UI state in `profile_memory_v1`
- progressive profile memory is also persisted server-side in the same durable database layer
- older dialogue is compressed into:
  - `conversationDigest`
  - `openLoops`
  - `lastAssistantGuidance`
- current memory layers are:
  - short-term: recent chat window
  - medium-term: compact recent summary
  - long-term: concern themes, knowledge level, tone, relationship context, and older-dialogue digest
- server memory identity prefers:
  - `userId` when authenticated
  - `installationId` as fallback
- local dev launch DB path:
  - `server/data/sazoo-launch.sqlite`
- production/preview durable DB:
  - Neon Postgres via Vercel `DATABASE_URL`
- durable data model currently includes:
  - user state
  - special report unlocks
  - chat summaries
  - profile memory
  - wallet ledger
  - invite claims
- legacy memory migration source:
  - `server/data/profile-memory.sqlite`

## 7. Firebase Status

Firebase is initialized in:
- `src/config/firebase.ts`

Current connected feature:
- Google social login for onboarding
- Firebase Analytics event collection for launch metrics

Current behavior:
- if Firebase config is incomplete, the app degrades safely
- social login button becomes unavailable instead of crashing the flow
- after Firebase login, installation-scoped user state, unlocks, chat summaries, and progressive profile memory are promoted to `userId`-backed records
- analytics initialization is skipped safely on unsupported browsers
- non-production analytics events include `debug_mode` so Firebase DebugView can inspect launch metrics quickly
- early app-boot analytics events are queued briefly so invite-based launch events are not dropped before Firebase is ready
- launch analytics currently flow to:
  - local storage
  - the internal Express collector
  - Firebase Analytics

## 8. Currency Rules Currently Implemented

- Daily free yeopjeon pool:
  - `3` free coins
  - expires after `24 hours` if unused
  - does not accumulate across days
- Spend order:
  - free coins first
  - paid coins second
- Current visible UI:
  - free chat pool in the chat header as `current/max`
  - paid balance shown separately
  - profile wallet card shows:
    - free-pool expiry countdown
    - rewarded-ad remaining count
    - ad reset countdown
    - paid starter bundle CTA
- Failure handling:
  - failed chat requests refund the consumed coin source
- Rewarded ads:
  - current provider scaffold is `DARO`
  - development and staging use a mock completion flow until the DARO SDK bridge is attached
  - production stays `not_ready` until the real bridge is wired
  - server wallet claims now use `rewardClaimId` idempotency so duplicate reward callbacks do not double-credit coins
- Purchase bundle:
  - `yeopjeon_3_bundle`
  - `3` paid yeopjeon
  - `500 KRW`
  - server-side Google Play receipt verification endpoint now exists for real purchase token validation
- Persistence:
  - wallet state is now backed by a durable database ledger
  - local development falls back to SQLite
  - Vercel preview/production use Neon Postgres through `DATABASE_URL`
  - local storage remains as optimistic cache / fallback
  - ledger tracks:
    - `earned_from_daily`
    - `earned_from_ads`
    - `earned_from_invite`
    - `purchased`
    - `purchased_verified`
    - `spent`
    - `refund`
    - `expired`
- Still not launch-complete:
  - the Android/iOS store SDK still needs to send live purchase tokens into the verification endpoint
  - Apple receipt verification is not connected yet
  - the live DARO SDK bridge is still pending

Bridge/documentation:
- DARO Android/Web bridge contract is documented in `docs/DARO_BRIDGE_SPEC.md`
## 9. Performance Optimizations Already Applied

### A. First Response Speed
- Local first reading before deep AI completion
- shortened analyzing screen
- faster message typing animation

### B. Mobile Rendering
- viewport height synced with `visualViewport`
- touch-safe button sizing
- overflow and safe-area handling
- reduced blur / motion pressure on low-powered mobile conditions

### C. 3D Optimization
- default home GLB compressed and reduced
- `three-scene` lazy chunk separated
- `ktx2-vendor` split from the default path
- default model preloaded during idle time
- 3D runtime errors isolated with retry fallback

### D. Rendering Optimization
- context usage split to reduce unnecessary re-renders
- lazy loading for heavy screens and the 3D scene
- dynamic imports kept for share rendering and large scene code

## 10. Asset Strategy

Critical assets are warmed through `components/AssetPreloader.tsx`.

Currently preloaded:
- key onboarding images
- key onboarding / reading media
- default home GLB during idle time

Static assets are stored in:
- `public/`

This includes:
- images
- videos
- GLB files
- basis / draco decoder assets

## 11. Deployment Status

- Git remote is connected to GitHub:
  - `team-espero/sazoo`
- GitHub `main` branch protection is enabled:
  - required check: `verify`
  - approvals required: `1`
- Vercel project is linked:
  - `msjs-projects/sazoo`
- Production is currently served from:
  - `https://sazoo.vercel.app`
- Preview deployments are automated through:
  - GitHub Actions
  - Vercel CLI with repository secrets / variables
- Server-side secrets:
  - `GEMINI_API_KEY` is stored only in Vercel Environment Variables
- Custom production domain:
  - not connected yet
  - intentionally deferred until the final domain is ready

## 12. Current Product Boundaries

The following are implemented but still product-incomplete:
- Tarot is still placeholder-level
- Naming is still placeholder-level
- FAQ / Terms actions are UI-only
- notifications are UI-level, not fully connected to an external push pipeline
- premium billing is simulated in-app, not fully store-connected

## 13. Key Files

- `App.tsx`: app shell, viewport sync, error boundary, screen switching
- `context.tsx`: global state, actions, onboarding, daily insights, coin logic
- `screens/MainScreen.tsx`: main tab orchestration and onboarding modal flow
- `screens/OnboardingScreen.tsx`: onboarding steps and Firebase Google login
- `screens/tabs/ChatScreen.tsx`: chat flow, first reading, deep reading behavior
- `screens/tabs/HomeTab.tsx`: home widgets and scene selection
- `components/HomeScene.tsx`: optimized three.js home scene runtime
- `components/AssetPreloader.tsx`: critical media and model warming
- `src/services/api.ts`: frontend API client
- `src/services/analytics.ts`: launch analytics dispatch to local storage, backend collector, and Firebase
- `src/services/ads/daroRewarded.ts`: DARO rewarded-ad scaffold with dev/staging mock completion
- `components/CurrencyManagementCard.tsx`: wallet UI for ad rewards, cooldowns, and starter bundle actions
- `server/invite/claimStore.js`: server-side invite claim dedupe and special report generation
- `server/wallet/store.js`: server-side wallet state, ledger, purchase, ad reward, and invite credit flow
- `server/runtime.js`: runtime bootstrap that selects durable Postgres on Vercel or local SQLite for development
- `server/db/postgres.js`: Neon-backed durable database helpers for Vercel environments
- `server/app.js`: backend HTTP layer
- `server/ai/geminiProvider.js`: Gemini orchestration, sanitization, fallback
- `server/memory/store.js`: server-backed progressive profile memory persistence and merge rules
- `server/ai/prompts/promptRegression.test.ts`: prompt regression coverage for contract, language continuity, and broken-text prevention
- `scripts/qa-live-gemini.mjs`: live Gemini QA for tone, length, and structured output checks
- `scripts/qa-memory-store.mjs`: launch DB memory migration and persistence self-test
- `scripts/qa-firebase-analytics.cjs`: Playwright QA for Firebase Analytics dispatch
- `scripts/qa-firebase-analytics-flow.cjs`: Playwright QA for invite entry to first-reading Firebase events
- `scripts/qa-currency-chat.cjs`: Playwright QA for free-pool display and failed-chat refund behavior
- `scripts/http-wallet-smoke.ps1`: production wallet persistence smoke check
- `scripts/vercel-chat-smoke.ps1`: Vercel-protected deployment chat smoke check

## 14. Summary

Sazoo is currently implemented as a **mobile-first, AI-assisted saju app** with:
- fast onboarding-to-reading flow
- a five-tab main experience
- optimized default 3D home scene
- split global state
- Express-backed Gemini integration
- Firebase-based Google login
- multilingual UI

This document should be treated as the **source of truth for the current implementation baseline**.
