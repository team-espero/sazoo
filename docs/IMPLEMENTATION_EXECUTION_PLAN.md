# Sazoo v2.1 (Forest) - Detailed Implementation Execution Plan

## 1. Purpose

This document breaks the launch checklist into actual implementation work units.

Use it like this:
- `IMPLEMENTATION_CHECKLIST.md` = status tracker
- `IMPLEMENTATION_EXECUTION_PLAN.md` = build order and concrete tasks

---

## 2. Ground Rules

- Implement in the order defined here.
- Each workstream must include:
  - code changes
  - state changes
  - API changes
  - QA changes
- Do not move to the next major workstream until the current one has:
  - working UI
  - persistence rule
  - failure handling
  - regression QA

---

## 3. Workstream Order

Build in this order:

1. Currency system hardening
2. Prompt architecture and progressive profiling
3. Git and Vercel connection
4. Firebase Google login finalization
5. Kakao login implementation
6. Share card + invite + deep link flow
7. Analytics instrumentation
8. Backend and data migration
9. Android release pipeline

---

## 4. Workstream 1 - Currency System Hardening

### 4.1 Goal

Turn the current prototype coin logic into a launch-accurate product rule:
- 3 free yeopjeon per day
- free coins expire if not used for 24 hours
- one completed chat exchange costs 1
- rewarded ads grant 1 coin, max 5 per day
- 3-coin paid bundle exists
- chat shows current/max clearly

### 4.2 Current Files To Change

- `context.tsx`
- `screens/tabs/ChatScreen.tsx`
- `components.tsx`
- `src/services/api.ts`
- `src/services/storage.ts`

Later, after backend migration:
- `server/app.js`
- future wallet endpoints

### 4.3 Implementation Steps

#### Step 1. Redefine currency state shape

Update `CurrencyValue` in `context.tsx`.

Target state shape:

```ts
type CurrencyValue = {
  freeCoins: number;
  freeCoinsMax: number;
  freeCoinsIssuedAt: number;
  freeCoinsExpiresAt: number;
  paidCoins: number;
  adsWatchedToday: number;
  lastAdResetTime: number;
  totalCoinsUsed: number;
  lastSpendAt: number | null;
};
```

Implementation notes:
- `freeCoinsMax` should be fixed at `3`
- `freeCoinsExpiresAt` should represent the 24-hour expiry point
- `paidCoins` must remain separate from free coins

#### Step 2. Define exact refill and expiry rule

Implement helper functions inside `context.tsx`:
- `issueDailyFreeCoins()`
- `expireStaleFreeCoins()`
- `resetDailyAdQuotaIfNeeded()`
- `getSpendableCoinSummary()`

Required behavior:
- when no valid free coins exist, issue `3`
- if `Date.now() > freeCoinsExpiresAt`, free coins become `0`
- free coins do not stack across missed days

#### Step 3. Define spend order

Add explicit rule:
- spend free coins first
- then spend paid coins

Expose a single action:
- `consumeConversationCoin(): Promise<boolean>`

This replaces ambiguous per-message spending logic.

#### Step 4. Define what counts as one conversation

Current issue:
- chat sends and renders in multiple async states
- retries could double-spend unless guarded

Implementation:
- create one send-cycle transaction per user message
- spend exactly once when request begins
- if request fails before assistant response is accepted, refund once

Add guard fields:
- `activeConversationId`
- `spentForConversationId`

#### Step 5. Update chat UI

In `screens/tabs/ChatScreen.tsx`:
- add top-left compact coin indicator
- show format `current/max`
- example `1/3`
- label should clearly imply daily free conversation count

Recommended display model:
- main badge: `freeCoins/freeCoinsMax`
- optional secondary badge or drawer info: paid coins

#### Step 6. Rewarded ad logic

In `context.tsx`:
- keep `adsWatchedToday`
- enforce cap `5`
- add helper:
  - `canWatchRewardAd()`
  - `grantRewardAdCoin()`

UI requirement:
- show remaining ad rewards for the day

#### Step 7. Purchase rule

For now, implement product config even if billing is not yet real.

Create constant:

```ts
const COIN_PRODUCTS = [
  { id: 'coin_pack_3', coins: 3, priceKrw: 500 }
];
```

Use it in:
- purchase modal
- future store billing mapping
- analytics payloads

#### Step 8. Persistence and migration

Update storage migration logic so old wallet objects do not break.

Add:
- wallet shape normalizer
- default migration from old fields to new fields

#### Step 9. QA

Required QA cases:
- user starts with 3 free coins
- user spends 1 conversation coin and sees `2/3`
- failed request refunds exactly once
- after 24h unused, free coins become 0
- free coins do not accumulate beyond 3
- ad reward stops after 5 ads
- paid coin purchase updates separately from free pool

### 4.4 Done When

- Chat coin display is visible and correct
- Spending is deterministic
- No double spending
- Expiry and refill rules work exactly as specified

---

## 5. Workstream 2 - Prompt Architecture And Progressive Profiling

### 5.1 Goal

Turn the current prompt logic into a maintainable system with controlled memory injection.

### 5.2 Current Files To Change

- `server/ai/geminiProvider.js`
- new folder: `server/ai/prompts/`
- new folder: `server/ai/context/`
- possibly `context.tsx`
- possibly `src/services/api.ts`

### 5.3 New Structure

Create this structure:

```txt
server/ai/prompts/
  baseSystemPrompt.js
  personaTonePrompt.js
  firstReadingPrompt.js
  deepReadingPrompt.js
  miniAppsPrompt.js
  fallbackPrompt.js

server/ai/context/
  buildContextPayload.js
  selectRelevantMemory.js
  summarizeConversation.js
  progressiveProfileSchema.js
```

### 5.4 Implementation Steps

#### Step 1. Split prompt layers

Move hardcoded prompt strings out of `geminiProvider.js`.

Each file must export:
- prompt purpose
- input contract
- prompt builder function

#### Step 2. Define profile schema

Create progressive profile schema:

```ts
type ProgressiveProfile = {
  identity: {
    name: string;
    gender: string | null;
    language: 'ko' | 'en' | 'ja';
  };
  birth: {
    birthDate: ...;
    calendarType: string;
    isTimeUnknown: boolean;
  };
  saju: {
    pillars: unknown;
    dominantElement?: string;
    supportElement?: string;
  };
  concerns: {
    primaryConcern?: string | null;
    recurringTopics: string[];
  };
  preferences: {
    tonePreference?: string | null;
    depthLevel?: 'light' | 'balanced' | 'deep';
  };
  relationshipContext: {
    profilesMentioned: string[];
  };
  miniApps: {
    frequentlyUsed: string[];
  };
};
```

#### Step 3. Define memory layers

Use 3 layers:

1. short-term memory
2. medium summary memory
3. long-term profile memory

Rules:
- short-term: last few turns only
- medium: rolling summary
- long-term: stable user facts only

#### Step 4. Add context selection function

Create `selectRelevantMemory.js`.

Inputs:
- user message
- progressive profile
- recent chat summary
- current feature source

Outputs:
- minimal context package for prompt injection

Rule:
- never inject the entire full history blindly

#### Step 5. Add progressive profiling update points

Update profile gradually after:
- onboarding
- first reading
- repeated chat themes
- mini-app usage
- relationship profile usage

Do not ask everything upfront.

#### Step 6. Add prompt QA harness

Prepare test cases for:
- no broken characters
- consistent tone
- response length floor
- correct use of available saju data
- multilingual response quality

### 5.5 Done When

- Prompt files are modular
- Context injection is selective
- Progressive profile grows intentionally over time

---

## 6. Workstream 3 - Git And Vercel Connection

### 6.1 Goal

Make deployment and versioning repeatable.

### 6.2 Git Tasks

#### Step 1. Remote connection

- connect repo to remote
- verify push and fetch

#### Step 2. Branch strategy

Recommended:
- `main` = production-ready
- `develop` = integration branch
- `feature/*` = isolated implementation work
- `release/*` = release prep if needed

#### Step 3. Protection

- protect `main`
- require PR for merge
- prevent secret commits

#### Step 4. Templates

Add:
- PR template
- issue template
- release note template

### 6.3 Vercel Tasks

#### Step 1. Project connection

- connect repo to Vercel
- configure build command
- configure output directory

#### Step 2. Environment separation

Set:
- preview env
- production env

Must include:
- `VITE_API_BASE_URL`
- Firebase public config values

#### Step 3. Deep link and asset verification

Verify:
- large video loads
- GLB loads
- direct route open does not fail
- invite/deep links can be resolved in Vercel routing

### 6.4 Done When

- preview deploy works
- production deploy works
- env separation is correct

### 6.5 Current Status

- Git remote connected and first commits pushed to `main`
- Vercel project linked to `msjs-projects/sazoo`
- `preview` and `production` environments configured
- `GEMINI_API_KEY` stored only in Vercel server-side environment variables
- Production currently serves from `https://sazoo.vercel.app`
- GitHub `main` branch protection is enabled with the `verify` status check and one required approval
- Vercel durable storage migrated from `/tmp` fallback to Neon-backed Postgres for production and preview
- Preview deployments are automated through GitHub Actions plus Vercel CLI
- Still pending:
  - custom production domain attachment once domain is available
  - direct Vercel Git integration to `team-espero/sazoo` if organization repository access is granted later

---

## 7. Workstream 4 - Firebase Google Login Finalization

### 7.1 Goal

Move Google login from "popup works" to real session behavior.

### 7.2 Current Files To Change

- `src/config/firebase.ts`
- `screens/OnboardingScreen.tsx`
- new file: `src/auth/AuthProvider.tsx`
- `App.tsx`
- `context.tsx`

### 7.3 Implementation Steps

#### Step 1. Add auth provider

Create:
- `src/auth/AuthProvider.tsx`

State:
- currentUser
- authLoading
- authProvider
- isGuest

Actions:
- loginWithGoogle
- logout
- continueAsGuest

#### Step 2. Persist auth state

Use Firebase auth observer:
- `onAuthStateChanged`

Hydrate auth state on app boot.

#### Step 3. Connect onboarding

In `OnboardingScreen.tsx`:
- Google button should not only log to console
- it should update actual auth state

#### Step 4. Guest vs logged-in mode

Define behavior:
- guest can try app
- logged-in user can sync profile and wallet

#### Step 5. Merge rule

If guest creates data, then logs in:
- either migrate local data to account
- or ask merge choice

Recommended for first release:
- auto-merge guest local profile into first authenticated account if no remote profile exists

### 7.4 Done When

- Google login survives reload
- guest and authenticated paths are distinct

---

## 8. Workstream 5 - Kakao Login Implementation

### 8.1 Goal

Replace the current Kakao placeholder button with a real login flow.

### 8.2 Current Files To Change

- `screens/OnboardingScreen.tsx`
- new file: `src/auth/kakao.ts`
- new file: `src/auth/AuthProvider.tsx`
- later backend auth endpoints if token exchange is added

### 8.3 Implementation Steps

#### Step 1. Choose integration route

For web:
- Kakao JavaScript SDK

For app builds:
- plan redirect/deep link compatibility

#### Step 2. Add provider wrapper

Create:
- `loginWithKakao()`
- normalize Kakao account data

#### Step 3. Unify user shape

Map Google and Kakao users to one auth model:

```ts
type AppAuthUser = {
  uid: string;
  provider: 'google' | 'kakao';
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
};
```

#### Step 4. Error handling

Add explicit states for:
- popup blocked
- domain not allowed
- user canceled
- provider unavailable

### 8.4 Done When

- Kakao login works as a real provider and updates session state like Google login does

---

## 9. Workstream 6 - Share Card, Invite Flow, Deep Link Restoration

### 9.1 Goal

Build the viral loop end to end.

### 9.2 Current Files To Change

- `components/ShareableFortune.tsx`
- `components.tsx`
- `screens/tabs/HomeTab.tsx`
- `screens/tabs/ChatScreen.tsx`
- `App.tsx`
- new files:
  - `src/routing/deepLink.ts`
  - `src/invite/inviteState.ts`
  - `src/services/share.ts`

Later backend:
- invite token generation / claim endpoints

### 9.3 Implementation Steps

#### Step 1. Share card model

Create share card types:

```ts
type ShareCardMode =
  | 'my_result'
  | 'compare_with_friend'
  | 'invite';
```

#### Step 2. Add compare card layout

Required structure:
- my result summary
- friend result summary
- comparison message
- CTA / invite marker

#### Step 3. Deep link route model

Define routes such as:
- `/invite/:token`
- `/compare/:token`
- `/fortune/:token`

#### Step 4. App boot restoration

At app start:
- parse URL or deep link
- store pending restore intent
- if app is newly installed or just opened, navigate to the intended screen

#### Step 5. Reward handling

Reward types:
- coin reward
- special report reward

Must add:
- duplicate claim protection
- self-invite protection

### 9.4 Done When

- share -> open -> install/open -> restore -> reward works reliably

### 9.5 Current Status

Implemented:
- comparison share card renderer is live and persists canonical share metadata before share
- invite links support path-based deep links such as `/compare/:token`
- legacy query-string invite links still resolve for backwards compatibility
- app boot captures invite links and restores the intended destination automatically for onboarded users
- restored invite context is shown in a dedicated modal before the recipient continues
- invite reward claims remain server-authoritative with duplicate-claim protection
- self-invite abuse is blocked on the server using persisted share ownership metadata
- Playwright QA covers first open, onboarding, reward claim, duplicate reopen, and restored comparison context

Remaining:
- extend the same deep-link restoration model into native app install attribution when Android universal/app links are finalized

---

## 10. Workstream 7 - Analytics Instrumentation

### 10.1 Goal

Make launch measurable from day one.

### 10.2 New Files To Add

- `src/services/analytics.ts`
- `src/services/analyticsEvents.ts`

### 10.3 Implementation Steps

#### Step 1. Event schema

Define event function wrappers:
- `trackShare`
- `trackInviteOpen`
- `trackInstallFromInvite`
- `trackD1Retention`
- `trackTimeToFirstValue`
- `trackOnboardingStepView`
- `trackOnboardingComplete`
- `trackCoinSpent`

#### Step 2. Add event hooks to flows

Add tracking to:
- onboarding step changes
- share action
- invite open
- first reading success
- scene change
- chat send
- coin spend

#### Step 3. Add payload conventions

Every event should include:
- `user_id` or guest id
- `language`
- `platform`
- `screen`
- `timestamp`

### 10.4 Done When

- required launch metrics are observable in one analytics dashboard

### 10.5 Current Status

Implemented:
- client analytics events persist locally, dispatch to the server collector, and mirror into Firebase Analytics
- invite funnel events are instrumented end to end from deep-link open through first reading
- product-health events now cover coin spend, rewarded-ad grants, invite reward grants, Home scene changes, and mini-app opens
- server launch metrics summary aggregates onboarding steps, time-to-first-value, and product-health breakdowns
- Profile tab launch metrics modal shows both launch funnel counts and product-health diagnostics, including `dailyInsights.source`
- event contract and QA checklist are documented in:
  - `docs/ANALYTICS_EVENT_SPEC.md`
  - `docs/ANALYTICS_QA_CHECKLIST.md`

Remaining:
- optional external dashboard mapping beyond Firebase DebugView / internal report view

---

## 11. Workstream 8 - Backend And Data Migration

### 11.1 Goal

Move launch-critical data away from local-only state.

### 11.1A Current Status

Implemented:
- launch DB runtime with PostgreSQL primary and SQLite fallback
- backend stores for users, auth identities, wallet ledger, invite claims, unlocks, chat summaries, profile memory, and share metadata
- wallet ledger read endpoint and server-authoritative wallet spending / refund / reward flows
- frontend cache reconciliation keyed by `userId` or `installationId`
- local dev seed script for launch-state smoke testing

Remaining:
- migrate deep link share/invite route payloads into the same canonical backend flow
- remove any last UI paths that still rely on local mirrored state instead of refreshed backend state
- add a dedicated ops view for share-card metadata and invite abuse review

### 11.2 Files To Add Or Maintain

Current server structure now includes:

```txt
server/db/
  launchDb.js
  postgres.js

server/authIdentity/
server/chat/
server/invite/
server/memory/
server/share/
server/unlocks/
server/user/
server/wallet/
```

### 11.3 Implementation Steps

#### Step 1. Choose DB

Recommended:
- PostgreSQL for structured user/wallet/invite data

Status:
- done, with Neon / Postgres as durable primary and SQLite as local fallback

#### Step 2. Add schema

Initial tables:
- users
- auth_identities
- profiles
- wallet_ledger
- unlocks
- invite_records
- chat_memory_summary
- share_card_metadata

Status:
- done for launch DB and Postgres stores

#### Step 3. Add endpoints

Add:
- `POST /auth/login`
- `GET /user/profile`
- `POST /user/profile`
- `GET /user/coins`
- `POST /user/coins/spend`
- `POST /user/coins/reward`
- `POST /invite/create`
- `POST /invite/claim`
- `POST /wallet/ledger`
- `POST /auth/identities/state`
- `POST /auth/identities/upsert`
- `POST /share-cards/metadata/state`
- `POST /share-cards/metadata/upsert`

Status:
- mostly done; remaining work is route consolidation, not capability gaps

#### Step 4. Replace local source of truth

Frontend migration order:
1. wallet
2. profile
3. unlocks
4. invite state

Status:
- wallet, profile, unlocks, and auth promotion are backend-first
- local storage remains as a fast mirror and offline fallback only

#### Step 5. Keep local cache

Local storage becomes:
- cache only
- never source of truth

Status:
- implemented with cache owner reconciliation and launch-state invalidation

### 11.4 Done When

- launch-critical user state survives reinstall and cross-device use
- backend is the canonical source for wallet, unlocks, promoted auth state, and profile memory

---

## 12. Workstream 9 - Android Release Pipeline

### 12.1 Goal

Produce real testable Android outputs and final store-ready bundle.

### 12.2 Current Files To Use

- `capacitor.config.ts`
- `android/`
- existing mobile scripts in `package.json`

### 12.3 Implementation Steps

#### Step 1. Release metadata

Verify:
- package name
- app name
- versioning
- icons
- splash assets

#### Step 2. Signing

Prepare:
- keystore
- signing config
- secure secret storage

#### Step 3. Output generation

Generate in order:
1. debug APK
2. internal QA APK
3. release AAB

#### Step 4. QA on device

Must verify:
- login
- onboarding
- first reading
- coin display
- rewarded ad rule
- share flow
- invite deep link
- restore after install

### 12.4 Done When

- one QA APK and one release AAB are archived with version notes

---

## 13. Immediate Build Plan For The Next 3 Implementation Cycles

### Cycle A

Do first:
- currency state redesign
- chat coin counter UI
- chat spend/refund guard
- ad reward daily cap finalization

### Cycle B

Then:
- prompt file split
- progressive profiling schema
- context selector
- prompt test harness

### Cycle C

Then:
- Git remote and branch strategy
- Vercel preview/prod connection
- Firebase Google auth provider
- persistent auth state

---

## 14. Definition Of ?쏳eady To Start Coding??

A workstream is ready to implement when:
- target files are identified
- state shape is defined
- API contract is defined if needed
- QA cases are listed
- rollout order is fixed

This document is intended to satisfy that bar.

