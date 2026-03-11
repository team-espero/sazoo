# DARO Android/Web Bridge Spec

## Purpose

This document defines the bridge contract that the Sazoo web layer expects from a future DARO rewarded-ad SDK integration.

The current runtime already uses this contract shape in `src/services/ads/daroRewarded.ts`.
The key rule is that **the same `rewardClaimId` must travel from the web layer to the native bridge and back to the server claim endpoint**.

## JS Bridge Contract

Global object:

```ts
window.__SAZOO_DARO__
```

Required method:

```ts
showRewardedAd(payload: {
  placementId: string;
  rewardClaimId: string;
}): Promise<boolean | {
  completed: boolean;
  rewardClaimId?: string;
  errorCode?: 'no_fill' | 'network' | 'internal';
}>
```

### Request Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `placementId` | `string` | yes | DARO placement slot id. Example: `profile_daily_reward` |
| `rewardClaimId` | `string` | yes | Sazoo-generated idempotency key for the reward claim |

### Response Rules

| Case | Bridge response | Meaning |
| --- | --- | --- |
| reward completed | `true` or `{ completed: true }` | web layer should call `/api/v1/wallet/rewarded-ad/claim` |
| reward completed with echoed id | `{ completed: true, rewardClaimId }` | preferred, preserves traceability |
| ad dismissed | `false` or `{ completed: false }` | no reward claim |
| SDK failure | `{ completed: false, errorCode }` | no reward claim, UI shows not-ready/dismissed state |

## Idempotency Rule

1. Web creates `rewardClaimId`
2. Web passes it into `window.__SAZOO_DARO__.showRewardedAd(...)`
3. If the reward completes, web sends the same `rewardClaimId` to `/api/v1/wallet/rewarded-ad/claim`
4. Server wallet ledger stores the claim and rejects duplicates with status `duplicate`

This prevents double-crediting when:
- native callbacks fire twice
- web retries after a partial network failure
- the page is resumed and the same reward completion is replayed

## Android Implementation Notes

Recommended implementation options:
- Capacitor plugin method that exposes `showRewardedAd(payload)` to the web layer
- WebView JS bridge that maps to the same promise contract

### Android-side payload handling

The native layer should:
- receive `placementId` and `rewardClaimId`
- open DARO rewarded ad for `placementId`
- resolve the promise only after final ad outcome
- return `completed: true` only after the reward callback is confirmed
- echo `rewardClaimId` back when possible

### Android-side guardrails

- Do not generate a second claim id in native code
- Do not auto-credit currency in native code
- Let the Sazoo server remain the source of truth for reward crediting
- If DARO emits duplicate reward callbacks, native may ignore extras, but server idempotency is still the final safeguard

## Web Behavior

Current runtime behavior:
- dev/staging: mock completion path
- prod without native bridge: `not_ready`
- prod with native bridge: promise-based DARO flow

Current files:
- `src/services/ads/daroBridge.ts`
- `src/services/ads/daroRewarded.ts`
- `components/CurrencyManagementCard.tsx`

## Server Contract

Reward claim endpoint:

```http
POST /api/v1/wallet/rewarded-ad/claim
```

Payload:

```json
{
  "installationId": "...",
  "userId": "optional-firebase-uid",
  "provider": "DARO",
  "placementId": "profile_daily_reward",
  "rewardClaimId": "daro_xxx"
}
```

Server responses:
- `claimed`: reward applied
- `duplicate`: reward already applied for this `rewardClaimId`
- `limit_reached`: daily cap already consumed

## QA Checklist

- Same `rewardClaimId` sent twice returns `claimed -> duplicate`
- Daily cap still stops at 5 rewarded ads
- Native dismiss path does not call reward claim endpoint
- Missing bridge in prod returns `not_ready`
- Staging mock still generates a valid `rewardClaimId`
