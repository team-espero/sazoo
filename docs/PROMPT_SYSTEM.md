# Sazoo Prompt System and Memory Context Guide

## 1. Scope

This document is the canonical guide for the current Phase 4 prompt architecture and memory-context design.

Current runtime files:
- `server/ai/prompts/promptVersion.js`
- `server/ai/prompts/layers.js`
- `server/ai/prompts/chatPrompt.js`
- `server/ai/prompts/dailyInsightsPrompt.js`
- `server/ai/prompts/miniApps/couplePrompt.js`
- `server/ai/prompts/miniApps/dreamPrompt.js`
- `server/ai/prompts/contextFormatting.js`
- `server/ai/prompts/contextSelection.js`
- `server/ai/prompts/shared.js`
- `server/ai/prompts/localFallbacks.js`
- `server/memory/store.js`
- `src/services/profileMemory.ts`

## 2. Prompt Versioning

- Global prompt version: `2026-03-11.phase4.v2`
- Layer versions:
  - `baseSystem: base-1`
  - `personaTone: persona-1`
  - `firstReading: first-reading-2`
  - `deepReading: deep-reading-2`
  - `dailyInsights: daily-insights-1`
  - `memoryContext: memory-1`
  - `fallback: fallback-2`

Rule:
- If a prompt layer meaningfully changes behavior, bump its layer version.
- If the overall prompt contract changes, bump the global prompt version too.

## 3. Prompt Layers

### Base System Prompt

Purpose:
- accuracy guardrails
- source-of-truth rule for supplied saju data
- no markdown / no broken text / no hidden history invention

Runtime file:
- `server/ai/prompts/layers.js`

### Persona Tone Prompt

Purpose:
- keep the voice mysterious, calm, intimate, and practical
- prevent robotic or generic-assistant phrasing

Runtime file:
- `server/ai/prompts/layers.js`

### First Reading Deepening Prompt

Purpose:
- continue from the local first reading without re-greeting
- sound like a second layer, not a reset

Runtime file:
- `server/ai/prompts/layers.js`

### Ongoing Deep Reading Prompt

Purpose:
- continue ongoing chat naturally
- answer current concern first

Runtime file:
- `server/ai/prompts/layers.js`

### Daily Insights Prompt

Purpose:
- generate structured home-screen JSON
- keep each field short, clean, and card-friendly

Runtime file:
- `server/ai/prompts/dailyInsightsPrompt.js`

### Mini App Prompts

Purpose:
- keep couple matching and dream reading isolated from the main chat prompt
- prevent full chat memory and saju-reading phrasing from leaking into mini-app output

Runtime files:
- `server/ai/prompts/miniApps/couplePrompt.js`
- `server/ai/prompts/miniApps/dreamPrompt.js`

### Fallback Prompt / Local Fallback Output

Purpose:
- preserve tone and usefulness when Gemini is slow, malformed, or unavailable

Runtime file:
- `server/ai/prompts/localFallbacks.js`

## 4. Memory Model

The current memory system uses three layers.

### Short-Term Memory

What it is:
- recent dialogue window only

Current rule:
- last `6` chat bubbles are trimmed on the client
- last `4` messages are injected into the server prompt budget

Runtime files:
- `screens/tabs/ChatScreen.tsx`
- `server/ai/prompts/contextSelection.js`

### Medium-Term Memory

What it is:
- compact summary of recurring concern flow

Current fields:
- `recentSummary`
- `conversationDigest`
- `openLoops`
- `lastAssistantGuidance`
- `lastUserQuestions`

Source:
- updated from natural chat usage
- synced to server-backed profile memory

Runtime file:
- `src/services/profileMemory.ts`

### Long-Term Profile Memory

What it is:
- stable user preference and concern buckets separate from the raw chat transcript

Current fields:
- `knowledgeLevel`
- `preferredTone`
- `primaryConcerns`
- `recurringTopics`
- `relationshipContext`

Runtime file:
- `src/services/profileMemory.ts`
- persisted in `server/memory/store.js`

## 5. Progressive Profiling Strategy

Current approach:
- do not block first value with extra onboarding
- seed memory from:
  - active profile
  - onboarding concern
  - `knowledgeLevel`
- enrich memory gradually from real user messages

Current concern buckets:
- `love`
- `wealth`
- `career`
- `health`
- `relationships`
- `family`
- `self`
- `timing`

Current scope decision:
- mini-app behavior is intentionally excluded from long-term profile memory in Phase 4
- reason: keep the core saju-reading memory clean and avoid polluting the main reading context with one-off mini-app interactions
- if a mini app becomes retention-critical later, it should be added as a separate memory slice instead of mixing into the base profile bucket

Current storage:
- local storage key: `profile_memory_v1`
- local fast path stored by `profileId`
- server-backed store:
  - SQLite launch database at `LAUNCH_DB_PATH`
  - table: `profile_memory_records`
  - legacy source migration: `PROFILE_MEMORY_DB_PATH`
  - owner preference: `userId` first, `installationId` fallback
  - merged by `profileId`
- after Firebase login, installation-backed memory is promoted into the same `userId` identity used by server-backed user state and unlocks

## 6. Context Injection Rule

Current order of priority:
1. current user message
2. relevant long-term concern themes
3. relationship context
4. medium-term summary
5. short recent dialogue window

Guardrails:
- never replay the full transcript
- never inject unrelated profile slices
- never invent hidden history beyond supplied memory fields
- when dialogue grows, compress older turns into:
  - `conversationDigest`
  - `openLoops`
  - `lastAssistantGuidance`

## 7. Inputs Per Prompt

### Chat Prompt

Inputs:
- `message`
- `language`
- `profile`
- `saju`
- `isInitialAnalysis`
- `memoryProfile`
- `recentMessages`
- `promptMode = chat`

Output:
- plain UTF-8 text only

### Daily Insights Prompt

Inputs:
- `language`
- `date`
- `profile`
- `saju`

Output:
- strict JSON object

### Mini App Prompts

Inputs:
- `language`
- `promptMode`
- `miniAppContext`

Output:
- `miniapp_couple`: strict JSON
- `miniapp_dream`: plain UTF-8 text only

## 8. Ownership

- Prompt layer logic: `server/ai/prompts/*`
- Runtime orchestration and model selection: `server/ai/geminiProvider.js`
- Client memory capture: `src/services/profileMemory.ts`
- Client short-term window selection: `screens/tabs/ChatScreen.tsx`
- Server memory persistence and merge rules: `server/memory/store.js`

## 9. Regression Coverage

Current automated regression coverage:
- `server/ai/prompts/promptRegression.test.ts`
- `scripts/qa-live-gemini.mjs`
- `scripts/qa-memory-store.mjs`
- `npm run ci:gemini`

It currently verifies:
- prompt contract stability for chat and daily insights
- broken-character prevention in prompts and local fallbacks
- continuation opening consistency across `ko`, `en`, and `ja`
- mini-app prompt separation from the main chat path
- fallback output minimum usefulness / length
- live Gemini tone / length / format checks for:
  - main chat
  - mini-app couple JSON
  - mini-app dream text
  - daily insights
- strict CI gates for:
  - response time
  - minimum and maximum output length
  - generic greeting rejection
  - markdown / fence rejection
  - output structure for mini-apps and daily insights
- launch DB memory migration and persistence for:
  - legacy profile memory import
  - dialogue digest / open loop storage
## 10. Next Expansion Points

- add stricter live-model QA for tone consistency across languages
- add CI workflow wiring so `npm run ci:gemini` runs on every protected branch build
- consider a separate mini-app memory slice only if a mini app becomes retention-critical
