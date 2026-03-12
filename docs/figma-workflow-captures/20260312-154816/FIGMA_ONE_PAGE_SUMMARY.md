# Sazoo Figma One-Page Summary

Use this as the fast reference sheet while rebuilding the app in Figma.

## Page Layout

| Figma Page | Frames |
|---|---|
| `01_Entry_Onboarding` | `01 Intro` → `02 Landing` → `03 Chat Intro` → `04 Social Login` → `05 Profile` → `06 Concern` → `07 Birth` → `08 Analyzing` → `09 Chat Main` |
| `02_Core_Navigation` | `10 Home`, `11 Home / Scene Menu`, `12 Calendar`, `13 Calendar / Day Sheet`, `14 Profile`, `20 Mini Apps` |
| `03_Profile_Account_Flows` | `15 Profile / Switcher`, `16 Add Modal`, `17 Switcher + Added`, `18 Upgrade Modal`, `19 Edit Modal` |
| `04_MiniApp_Flows` | `21 Couple / Partner Select` → `22 Couple / Input` → `23 Couple / Analyzing` → `24 Couple / Result`, `25 Dream / Input` → `26 Dream / Pending` |

## Frame Import Order

| No | Frame Name | PNG |
|---|---|---|
| 01 | Intro | `01_intro.png` |
| 02 | Landing | `02_landing.png` |
| 03 | Chat Intro | `03_chat_pre_onboarding.png` |
| 04 | Onboarding / Social Login | `04_onboarding_step0_login.png` |
| 05 | Onboarding / Profile | `05_onboarding_step1_profile.png` |
| 06 | Onboarding / Concern | `06_onboarding_step2_concern.png` |
| 07 | Onboarding / Birth | `07_onboarding_step3_birth.png` |
| 08 | Analyzing | `08_analyzing.png` |
| 09 | Chat Main | `09_chat_main.png` |
| 10 | Home | `10_home.png` |
| 11 | Home / Scene Menu | `11_home_scene_menu.png` |
| 12 | Calendar | `12_calendar.png` |
| 13 | Calendar / Day Sheet | `13_calendar_detail_sheet.png` |
| 14 | Profile | `14_profile.png` |
| 15 | Profile / Switcher | `15_profile_switcher.png` |
| 16 | Profile / Add Modal | `16_profile_add_modal.png` |
| 17 | Profile / Switcher + Added | `17_profile_switcher_with_added_profile.png` |
| 18 | Profile / Upgrade Modal | `18_profile_upgrade_modal.png` |
| 19 | Profile / Edit Modal | `19_profile_edit_modal.png` |
| 20 | Mini Apps | `20_miniapps.png` |
| 21 | Couple / Partner Select | `21_miniapps_couple_select_modal.png` |
| 22 | Couple / Input | `22_miniapps_couple_input.png` |
| 23 | Couple / Analyzing | `23_miniapps_couple_analyzing.png` |
| 24 | Couple / Result | `24_miniapps_couple_result.png` |
| 25 | Dream / Input | `25_miniapps_dream_input.png` |
| 26 | Dream / Pending | `26_miniapps_dream_pending.png` |

## Main Prototype Links

| From | To |
|---|---|
| Intro | Landing |
| Landing | Chat Intro |
| Chat Intro | Social Login |
| Social Login | Profile |
| Profile | Concern |
| Concern | Birth |
| Birth | Analyzing |
| Analyzing | Chat Main |
| Chat Main | Home |
| Home | Calendar / Profile / Mini Apps |
| Home | Home / Scene Menu |
| Calendar | Calendar / Day Sheet |
| Profile | Profile / Switcher |
| Profile / Switcher | Add Modal / Upgrade Modal |
| Mini Apps | Couple / Partner Select |
| Couple / Partner Select | Couple / Input |
| Couple / Input | Couple / Analyzing |
| Couple / Analyzing | Couple / Result |
| Mini Apps | Dream / Input |
| Dream / Input | Dream / Pending |

## Rebuild As Components

| Component | Reuse In |
|---|---|
| Top header | Landing, Home, Calendar, Profile, Mini Apps, Dream |
| Primary CTA button | Landing, Chat Intro, Onboarding, Dream |
| Bottom tab bar | Chat Main, Home, Calendar, Profile, Mini Apps, Dream |
| Glass card | Home, Calendar, Profile, Couple Result |
| Modal shell | Scene Menu, Day Sheet, Profile Switcher, Add Modal, Upgrade Modal, Edit Modal, Partner Select |
| Coin chip | Mini Apps, Couple, Dream |
| Avatar tile | Profile flows, Couple flow |

## Notes

- Frame size: `430 x 932`
- Total captures: `26`
- `26 Dream / Pending` is not the final dream result screen.
- Use PNGs as tracing/reference bases, then rebuild UI layers on top.

## Source

- `index.md`
- `FIGMA_HANDOFF.md`
- `FIGMA_PAGE_STRUCTURE_TABLE.md`
