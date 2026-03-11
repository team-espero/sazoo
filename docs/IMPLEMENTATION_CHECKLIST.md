# Sazoo v2.1 (Forest) - Step-by-Step Implementation Checklist

## 0. How To Use This File

- This checklist is the execution order for development.
- Work from top to bottom.
- Do not skip a phase unless its dependencies are already complete.
- Detailed implementation breakdown lives in `docs/IMPLEMENTATION_EXECUTION_PLAN.md`.

## Status Legend

- `[x]` done
- `[~]` partially done
- `[ ]` not started

## Release Rule

Before public launch, all items under:
- `Phase 1`
- `Phase 2`
- `Phase 3`
- `Phase 4`
- `Phase 5`
- `Phase 6`
- `Phase 7`
- `Phase 8`
- `Phase 9`

must be complete.

---

## Phase 1. Product Baseline Freeze

Goal: lock the current optimized baseline before adding launch features.

- [x] Current app structure documented in `docs/app_feature_guide.md`
- [x] Current implementation baseline documented in this checklist
- [x] Freeze current UI flow screenshots for regression comparison
- [x] Freeze key API request/response examples for regression comparison
- [x] Freeze current asset inventory snapshot before launch work
- [x] Freeze current public QA screenshots for:
  - intro
  - landing
  - onboarding
  - first reading
  - home
  - chat
  - mini apps
  - profile

Latest baseline freeze:
- `docs/baselines/20260310-223132/`
- manifest: `docs/baselines/20260310-223132/baseline-manifest.json`
- local captures: `docs/baselines/20260310-223132/captures-local/index.md`
- public captures: `docs/baselines/20260310-223132/captures-public/index.md`
- API examples: `docs/baselines/20260310-223132/api-examples/README.md`
- asset snapshot: `docs/baselines/20260310-223132/asset-snapshot/asset-snapshot.md`

Done when:
- A stable before/after comparison set exists for all major screens.

---

## Phase 2. Launch-Critical UX Requirements

Goal: implement the must-have launch requirements that directly affect growth and retention.

### 2.1 Share / Invite / Viral Loop

- [x] Add share card structure for:
  - my result
  - friend result
  - comparison summary
- [x] Add invite link generation from share cards
- [x] Add deep link routing for invite links
- [x] Restore the correct target screen immediately after install/open from invite link
- [x] Add invite reward logic:
  - coin reward
  - special report reward
- [x] Add invite landing UX copy
- [x] Add invite acceptance / restoration QA flow

Done when:
- User can share a comparison card.
- Friend can open invite link.
- After install or first open, the app restores the intended screen.
- Reward is granted exactly once per valid invite flow.

### 2.2 First Value Within 30 Seconds

- [x] Reduce onboarding friction to reach first value in under 30 seconds
- [x] Review onboarding step count and remove non-essential friction
- [x] Keep birth input accurate without slowing first analysis
- [x] Measure actual time to first reading on mobile network
- [x] Add regression check for `time_to_first_value`

Done when:
- New user can reach first meaningful reading in under 30 seconds on a normal mobile device.

### 2.3 Event Tracking Required For Launch

- [x] Track `share`
- [x] Track `invite_open`
- [x] Track `install_from_invite`
- [x] Track `d1_retention`
- [x] Track `time_to_first_value`
- [x] Track onboarding drop-off by step
- [x] Track first-reading success / failure
- [x] Add internal launch metrics report view

Done when:
- Event names, trigger timing, payload spec, and QA steps are documented and implemented.

---

## Phase 3. Currency System

Goal: finalize the coin economy as an actual launch rule set.

### 3.1 Core Currency Rules

- [x] Daily free coins exist in state
- [x] Enforce exact rule: user receives `3` free yeopjeon per day
- [x] Enforce exact rule: free yeopjeon do not accumulate indefinitely
- [x] Enforce exact rule: if unused for `24 hours`, free yeopjeon expire
- [x] Separate free coins from paid coins in UI and server logic
- [x] Clarify reset timing:
  - rolling 24h rule
  - or local-day reset rule
- [x] Document final rule in product copy and backend rule doc

### 3.2 Chat Consumption Rule

- [x] Chat currently consumes coins
- [x] Enforce exact rule: one full conversation exchange costs `1` yeopjeon
- [x] Define conversation unit precisely:
  - one user input
  - one assistant output
  - together count as `1`
- [x] Prevent double consumption on retries / network failures
- [x] Show insufficient-coin UI before sending

### 3.3 Purchase / Ad Reward Rule

- [x] Purchase sandbox flow exists in UI and server state
- [x] Add product definition: `3 yeopjeon bundle = 500 KRW`
- [x] Add ad reward rule: watching one ad grants `1` yeopjeon
- [x] Daily ad limit exists in state
- [x] Enforce exact rule: maximum `5` rewarded ads per day
- [x] Add visible cooldown / remaining ad count UI
- [x] Prevent duplicate ad reward crediting
- [x] Add server-side Google Play receipt verification endpoint
- [~] Connect native billing SDK purchase tokens to the verification endpoint
- [ ] Attach the real DARO SDK bridge and live rewarded-ad callbacks later

### 3.4 Currency UI

- [x] Coin info already appears in parts of the app
- [x] Add left-top coin display in chat room
- [x] Display format as `current/max`, example `1/3`
- [x] Make it obvious that the display refers to the daily free conversation pool
- [x] Show paid coin balance separately if needed
- [x] Update copy for zero-state and refill-state

### 3.5 Currency Persistence

- [x] Move coin ledger logic from local-only state to launch-ready persistence
- [x] Keep local optimistic UI but back it with server-authoritative state
- [x] Migrate legacy wallet JSON data into the DB ledger on first boot
- [x] Add audit fields for:
  - earned_from_daily
  - earned_from_ads
  - earned_from_invite
  - purchased
  - spent
  - expired
  - purchased_verified

Done when:
- Currency rules are exact, visible, testable, and cannot be double-counted.

---

## Phase 4. Prompt System And Memory Context Design

Goal: organize prompt instructions and apply progressive profiling so responses stay personal without bloating context.

### 4.1 Prompt Architecture

- [x] Persona tone and output shaping exist
- [x] Separate prompt layers into explicit files or modules:
  - base system prompt
  - persona tone prompt
  - first-reading prompt
  - deep-reading prompt
  - mini-app prompts
  - fallback prompts
- [x] Document prompt ownership and update rule
- [x] Add prompt versioning
- [x] Add prompt test cases for:
  - [x] broken character prevention
  - [x] tone consistency / continuation contract
  - [x] multilingual consistency
  - [x] long-answer quality regression and live-model QA

### 4.2 Progressive Profiling

- [x] Implement progressive profiling strategy
- [x] Collect only minimum onboarding data required for first value
- [x] Expand user profile over time through natural usage
- [x] Store explicit long-term profile fields separately from temporary chat state
- [x] Define profile buckets such as:
  - [x] identity basics
  - [x] birth / saju data
  - [x] concern themes
  - [x] preferred tone
  - [x] relationship context
  - [x] recurring topics
  - [x] mini-app behavior explicitly excluded from Phase 4 core memory scope

### 4.3 Memory / Context Budget Control

- [x] Define short-term memory window for active conversation
- [x] Define medium-term summary memory
- [x] Define long-term profile memory
- [x] Summarize older chat context instead of raw replay
- [x] Prevent prompt bloat by injecting only relevant profile slices
- [x] Add context selection rule:
  - current question intent
  - relevant profile fields only
  - recent dialogue summary only
- [x] Add privacy-safe memory rules for sensitive user data

### 4.4 Prompt Instruction Documentation

- [x] Prompt instruction text exists in ad-hoc docs
- [x] Create a canonical prompt instruction document
- [x] Map each prompt to:
  - purpose
  - inputs
  - injected memory
  - output format
  - fallback behavior
- [x] Keep this synced with actual runtime prompt code
- [x] Add a CI-ready live Gemini gate with stricter timing / tone / format thresholds

Done when:
- Prompt behavior is modular.
- Context injection is intentional.
- Memory grows through progressive profiling instead of brute-force transcript stuffing.
- Live Gemini QA can verify tone, length, and format for production-facing prompt paths.

---

## Phase 5. Source Control And Deployment Pipeline

Goal: set up the actual shipping pipeline before production integrations expand further.

### 5.1 Git Connection

- [x] Connect repository to remote Git provider
- [x] Define branch strategy
- [x] Protect main branch
- [x] Add `.env` / secret ignore verification
- [x] Add PR checklist
- Guide: `docs/deploy/13-github-branch-protection.md`
- [x] Add release tagging convention

### 5.2 Vercel Connection

- [x] Connect frontend to Vercel
- [x] Define environments:
  - development
  - preview
  - production
- [x] Set Vercel environment variables
- [x] Confirm `VITE_API_BASE_URL` for each environment
- [ ] Configure preview deploys on PR via Git integration
- [x] Confirm static asset serving for video / GLB works on Vercel
- [~] Confirm routing does not break deep links

### 5.3 Backend Deployment Plan

- [x] Decide final backend host
- [x] Add production env template for backend
- [~] Add domain / CORS plan
- [x] Add health check monitor
- [x] Add production log strategy
- [ ] Connect custom production domain later when domain is ready

Done when:
- Code is versioned properly and frontend preview/prod deploys are repeatable.

---

## Phase 6. Authentication Layer

Goal: move from prototype-style onboarding to real launch auth flow.

### 6.1 Firebase Google Login

- [~] Firebase config and Google popup login exist
- [ ] Finalize Firebase project settings
- [ ] Add production authorized domains
- [ ] Connect Google login result to app user state
- [ ] Persist login state between sessions
- [ ] Define guest mode vs logged-in mode behavior
- [ ] Decide guest-to-account merge rule
- [ ] Add logout flow
- [ ] Add auth error states and retry UX

### 6.2 Kakao Login

- [~] Kakao button exists as UI only
- [ ] Add Kakao SDK / provider integration
- [ ] Add Kakao login flow
- [ ] Normalize Kakao user profile into app auth model
- [ ] Align Kakao login with Google login state shape
- [ ] QA domain / redirect flow for web and app

### 6.3 Auth Provider / Session Model

- [ ] Add dedicated `AuthProvider`
- [ ] Store authenticated user session separately from Saju state
- [ ] Add token refresh strategy if backend auth is introduced
- [ ] Add account-linked profile sync strategy

Done when:
- User can continue as guest or login.
- Google and Kakao both work.
- Session state survives reloads and production domains.

---

## Phase 7. Backend And Data Migration

Goal: replace prototype-only persistence with launch-ready data flow.

### 7.1 Server API Expansion

- [x] AI proxy endpoints exist
- [x] Add auth endpoints
- [x] Add user profile read/write endpoints
- [ ] Add coin ledger endpoints
- [x] Add unlock state endpoints
- [x] Add invite / reward endpoints
- [ ] Add share card metadata endpoints if needed

### 7.2 Database

- [x] Choose final DB:
  - PostgreSQL
  - or MongoDB
- [~] Create schema for:
  - [x] users
  - [~] auth identities
  - [x] wallet / ledger
  - [x] unlocks
  - [x] invite records
  - [x] chat summaries
  - [x] profile memory
- [~] Add migration strategy
- [ ] Add local dev seed data

### 7.3 Frontend Storage Migration

- [~] AI requests already use backend
- [x] Replace local-only profile persistence
- [ ] Replace local-only wallet persistence
- [x] Replace local-only unlock persistence
- [~] Keep local cache only as a fast mirror
- [ ] Add cache invalidation rules

Done when:
- Local storage is no longer the source of truth for launch-critical state.

---

## Phase 8. Share Card, Invite Flow, Deep Link Restoration

Goal: finish the social growth loop end to end.

- [ ] Define share card templates:
  - my result only
  - my result vs friend result
  - invite card
- [ ] Build share renderer for comparison card
- [ ] Create invite token format
- [ ] Create deep link route mapping
- [ ] Restore exact destination screen after install/open
- [ ] Restore comparison context after install/open
- [ ] Add invite reward claim guard
- [ ] Add anti-abuse checks
- [ ] QA web open -> install -> reopen -> restore flow
- [ ] QA app installed -> direct open -> restore flow

Done when:
- Invite flow works reliably across direct open, reinstall, and first install.

---

## Phase 9. Analytics And Launch Metrics

Goal: make launch measurable.

- [x] Choose analytics tool
- [x] Define event taxonomy
- [x] Implement required launch events:
  - `share`
  - `invite_open`
  - `install_from_invite`
  - `d1_retention`
- [~] Implement product health events:
  - onboarding_step_view
  - onboarding_complete
  - first_reading_success
  - first_reading_fail
  - coin_spent
  - ad_reward_granted
  - invite_reward_granted
  - scene_change
  - mini_app_open
- [~] Add event payload spec
- [~] Add analytics QA checklist
- [x] Add server-backed launch metrics summary endpoint
- [x] Add Profile tab launch metrics modal
- [x] Add Firebase Analytics event dispatch
- [x] Add Playwright QA for Firebase Analytics dispatch
- [x] Add Playwright QA for invite-open to first-reading Firebase flow

Done when:
- Launch growth and retention can be measured without guessing.

---

## Phase 10. APK / AAB Release Pipeline

Goal: produce a real mobile release path, not just a local dev build.

### 10.1 Android Build Readiness

- [~] Capacitor Android pipeline exists
- [ ] Verify signing config
- [ ] Verify versionCode / versionName strategy
- [ ] Verify production app icons / splash / store graphics
- [ ] Verify package name and manifest metadata
- [ ] Verify Firebase config for Android build if needed

### 10.2 Output Artifacts

- [ ] Generate debug APK for internal QA
- [ ] Generate release APK for direct distribution if needed
- [ ] Generate release AAB for Play Store upload
- [ ] Archive output paths and version numbers

### 10.3 Mobile QA Before Upload

- [ ] Verify login flow
- [ ] Verify onboarding flow
- [ ] Verify first reading speed
- [ ] Verify coin display in chat
- [ ] Verify deep links
- [ ] Verify share flow
- [ ] Verify install-from-invite flow
- [ ] Verify crash-free startup on multiple devices

Done when:
- QA APK exists for testing.
- Release AAB exists for store submission.

---

## Phase 11. Remaining Existing Workstreams

Goal: preserve earlier roadmap items that still matter for launch quality.

- [x] Global error boundary
- [x] AI proxy and timeout handling
- [x] Home scene fallback UI
- [x] Mobile viewport handling
- [x] Default home GLB optimization
- [ ] Compress remaining major GLB assets
- [ ] Improve typecheck stability
- [ ] Expand regression QA automation
- [ ] Add real FAQ / Terms destinations
- [ ] Finalize store policy / privacy / legal copy

---

## Phase 12. Recommended Execution Order

Work in this exact order:

1. Product baseline freeze
2. Launch-critical UX requirements
3. Currency system
4. Prompt system and progressive profiling
5. Git connection
6. Vercel connection
7. Firebase Google login finalization
8. Kakao login implementation
9. Backend/data migration
10. Share/invite/deep link restoration
11. Analytics
12. APK and AAB release pipeline

---

## Phase 13. Immediate Next Tasks

If development starts now, begin with these in order:

- [ ] Finalize coin rule spec in code + UI copy
- [x] Add chat top-left coin counter in `current/max` format
- [x] Create prompt architecture document and split runtime prompt layers
- [x] Design progressive profiling data model
- [x] Connect Git remote and protect main branch
- [~] Connect Vercel preview and production envs
- [ ] Connect custom production domain when domain is available
- [x] Finalize Firebase Google auth state handling
- [ ] Implement Kakao login for real
- [ ] Define invite deep link route spec
- [ ] Implement launch event instrumentation
- [ ] Prepare Android release signing and AAB generation

---

## Working Rule

After every completed item:

- update this checklist
- update `docs/app_feature_guide.md` if behavior changed
- run QA on the affected flow
- store screenshots or logs for regression tracking
