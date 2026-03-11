# Analytics Event Spec

## Scope
- Client launch instrumentation
- Firebase Analytics mirror dispatch
- Server-backed launch metrics summary

## Core Identity Fields
Every client event includes these fields when available:

| Field | Meaning |
| --- | --- |
| `appEnv` | `dev`, `staging`, or `prod` |
| `installationId` | guest/install identity |
| `userId` | authenticated account identity |

## Launch Funnel Events

| Event | Trigger | Key payload fields |
| --- | --- | --- |
| `share` | share card render/share action | `inviteId`, `targetTab`, `source`, `language` |
| `invite_open` | app boot from invite/deep link | `inviteId`, `targetTab`, `source` |
| `install_from_invite` | first install/open attributed to invite | `inviteId`, `targetTab` |
| `onboarding_step_view` | onboarding step shown | `step`, `source`, `language` |
| `onboarding_step_complete` | onboarding step completed | `step`, `source`, `language` |
| `first_reading_success` | first Saju result shown | `language`, `profileId`, `source` |
| `first_reading_failure` | first Saju result failed | `language`, `errorCode`, `source` |
| `time_to_first_value` | first result milestone completed | `durationMs`, `withinTarget`, `milestone` |
| `d1_retention` | returning after 24h+ | `installAt`, `previousOpenAt` |

## Invite Reward Events

| Event | Trigger | Key payload fields |
| --- | --- | --- |
| `invite_reward_claimed` | invite claim accepted | `inviteId`, `rewardAmount`, `targetTab` |
| `invite_reward_granted` | paid coins actually credited | `amount`, `reason`, `paidCoins`, `freeCoins` |
| `invite_reward_duplicate` | duplicate claim blocked | `inviteId`, `targetTab` |
| `invite_reward_self_blocked` | self-invite blocked | `inviteId`, `targetTab` |
| `invite_reward_claim_failed` | invite claim request failed | `inviteId`, `message` |

## Product Health Events

| Event | Trigger | Key payload fields |
| --- | --- | --- |
| `coin_spent` | a paid or free coin is consumed | `contextKey`, `spendSource`, `freeCoins`, `paidCoins`, `totalCoinsUsed` |
| `ad_reward_granted` | rewarded ad claim succeeds | `provider`, `placementId`, `rewardAmount`, `rewardClaimId`, `remainingAdsToday` |
| `scene_change` | user changes Home 3D scene | `screen`, `sceneId`, `sceneName`, `sceneIndex` |
| `mini_app_open` | user opens supported mini app | `screen`, `appId`, `freeCoins`, `paidCoins` |

## Server Summary Shape

`GET /api/v1/client-events/report` returns:

- `counts`
- `timeToFirstValue`
- `onboarding.viewsByStep`
- `onboarding.completesByStep`
- `productHealth.coinSpendByContext`
- `productHealth.adRewardsByPlacement`
- `productHealth.miniAppOpenByApp`
- `productHealth.sceneChangeByScene`
- `recentEvents`

## Notes
- Firebase mirrors the same client events with normalized parameter keys.
- `dailyInsights.source` is not a client event; it is surfaced in the launch metrics UI as runtime diagnostic metadata.
