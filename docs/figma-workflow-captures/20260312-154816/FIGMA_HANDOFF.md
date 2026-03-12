# Sazoo Figma Workflow Handoff

This package is the latest mobile workflow capture set for Figma reconstruction.

## Capture context

- Source build: local Vite preview with API mocks
- Base URL: `http://127.0.0.1:5184`
- Capture timestamp (UTC): `2026-03-12T06:48:16.918Z`
- Frame size used during capture: `430 x 932`
- Total captures: `26`

## Recommended Figma page structure

### Page 1 - Entry and Onboarding

Import in this order:

1. `01_intro.png`
2. `02_landing.png`
3. `03_chat_pre_onboarding.png`
4. `04_onboarding_step0_login.png`
5. `05_onboarding_step1_profile.png`
6. `06_onboarding_step2_concern.png`
7. `07_onboarding_step3_birth.png`
8. `08_analyzing.png`
9. `09_chat_main.png`

Suggested Figma frame names:

- `01 Intro`
- `02 Landing`
- `03 Chat Intro`
- `04 Onboarding / Social Login`
- `05 Onboarding / Profile`
- `06 Onboarding / Concern`
- `07 Onboarding / Birth`
- `08 Analyzing`
- `09 Chat Main`

### Page 2 - Core Navigation

Import in this order:

1. `10_home.png`
2. `11_home_scene_menu.png`
3. `12_calendar.png`
4. `13_calendar_detail_sheet.png`
5. `14_profile.png`
6. `20_miniapps.png`

Suggested Figma frame names:

- `10 Home`
- `11 Home / Scene Menu`
- `12 Calendar`
- `13 Calendar / Day Sheet`
- `14 Profile`
- `20 Mini Apps`

### Page 3 - Profile and Account Flows

Import in this order:

1. `15_profile_switcher.png`
2. `16_profile_add_modal.png`
3. `17_profile_switcher_with_added_profile.png`
4. `18_profile_upgrade_modal.png`
5. `19_profile_edit_modal.png`

Suggested Figma frame names:

- `15 Profile / Switcher`
- `16 Profile / Add Modal`
- `17 Profile / Switcher + Added`
- `18 Profile / Upgrade Modal`
- `19 Profile / Edit Modal`

### Page 4 - Mini App Flows

Import in this order:

1. `21_miniapps_couple_select_modal.png`
2. `22_miniapps_couple_input.png`
3. `23_miniapps_couple_analyzing.png`
4. `24_miniapps_couple_result.png`
5. `25_miniapps_dream_input.png`
6. `26_miniapps_dream_pending.png`

Suggested Figma frame names:

- `21 Couple / Partner Select`
- `22 Couple / Input`
- `23 Couple / Analyzing`
- `24 Couple / Result`
- `25 Dream / Input`
- `26 Dream / Pending`

## Workflow map

### Primary user flow

`Intro -> Landing -> Chat Intro -> Onboarding -> Analyzing -> Main Chat -> Home`

### Main navigation

`Home <-> Chat <-> Calendar <-> Mini Apps <-> Profile`

### Secondary flows included

- Home scene selector
- Calendar day detail sheet
- Profile switcher and add-profile flow
- Premium upsell modal
- Couple mini-app full analysis path
- Dream mini-app input path

## Figma import guidance

- Use each PNG as a base frame background, not as a flattened full prototype page.
- Rebuild interactive layers on top of the image in separate groups:
  - header
  - body content
  - CTA area
  - bottom tab bar
  - modal or bottom sheet layer
- Keep modal captures on the same page as their parent flow and place them below the parent frame.
- Keep the bottom tab bar as a reusable component because it appears across most core screens.

## Important note

- `26_miniapps_dream_pending.png` is an input-state capture after submit, not a completed dream-result screen.
- For Figma workflow mapping, treat it as the transition frame between Dream Input and Dream Result.
- If a dedicated Dream Result frame is required later, recapture that flow separately.

## Source files

- Screen list: `index.md`
- Capture folder: `docs/figma-workflow-captures/20260312-154816/`
