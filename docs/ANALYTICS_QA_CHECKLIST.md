# Analytics QA Checklist

## Preflight
- `Firebase Analytics` is enabled for the active environment
- `VITE_FIREBASE_*` values match the target project
- `/api/v1/client-events/report` responds successfully

## Launch Funnel
- Open app from a clean session and verify `onboarding_step_view`
- Complete onboarding and verify `onboarding_step_complete`
- Reach the first Saju result and verify:
  - `first_reading_success`
  - `time_to_first_value`
- Force a failed first reading path and verify `first_reading_failure`

## Invite Flow
- Open an invite link and verify `invite_open`
- Complete install/open attribution and verify `install_from_invite`
- Claim reward once and verify:
  - `invite_reward_claimed`
  - `invite_reward_granted`
- Re-open same invite and verify `invite_reward_duplicate`
- Attempt self-invite and verify `invite_reward_self_blocked`

## Product Health
- Send a paid/free request and verify `coin_spent`
- Claim a rewarded ad and verify `ad_reward_granted`
- Change the Home 3D scene and verify `scene_change`
- Open each supported mini app and verify `mini_app_open`

## Launch Metrics UI
- Open `Profile > Launch Metrics`
- Verify cards show:
  - launch funnel counts
  - product health counts
  - `dailyInsights.source`
- Verify breakdown lists show:
  - coin spend contexts
  - ad placements
  - mini app ids
  - scene ids
- Verify recent events list renders the latest events in reverse chronological order

## Automated Checks
- `npm test`
- `npm run qa:firebase`
- `npm run qa:firebase:flow`
- `npm run build`
