# Sazoo Figma Page Structure Table

This table is a detailed page and frame mapping guide for rebuilding the current app workflow in Figma.

## 1. Page-Level Structure

| Figma Page | Purpose | Included Frames | Main User Goal | Reusable Components | Notes |
|---|---|---|---|---|---|
| `01_Entry_Onboarding` | First-touch flow from launch to first result | `01` to `09` | Enter app, start onboarding, finish first analysis | Logo header, universe CTA, onboarding card, wheel input, primary bottom CTA | This is the highest-priority prototype page. |
| `02_Core_Navigation` | Main product shells after onboarding | `10`, `11`, `12`, `13`, `14`, `20` | Explore home, calendar, profile, mini apps | Top header, top-right action button, bottom tab bar, modal sheet, glass cards | Build bottom tab bar as a shared component. |
| `03_Profile_Account_Flows` | Profile switching and account management | `15` to `19` | Switch profile, add profile, open premium modal, edit profile | Modal shell, avatar tile, form row, upgrade card | Keep these close to `14 Profile` for prototype continuity. |
| `04_MiniApp_Flows` | Couple and dream mini-app interaction flow | `21` to `26` | Select partner, start analysis, show result, enter dream text | Mini-app card, modal shell, coin chip, analysis state card, result card | `26` is a transition capture, not a final result state. |

## 2. Frame-Level Structure

| Order | Recommended Frame Name | Source PNG | Parent Figma Page | Screen Purpose | Entry Trigger | Exit Trigger | Build Priority |
|---|---|---|---|---|---|---|---|
| 01 | `Intro` | `01_intro.png` | `01_Entry_Onboarding` | Brand opening with intro video | App launch | Skip / auto-finish | High |
| 02 | `Landing` | `02_landing.png` | `01_Entry_Onboarding` | Language selection and first CTA | Intro finish | Start CTA | High |
| 03 | `Chat Intro` | `03_chat_pre_onboarding.png` | `01_Entry_Onboarding` | First character dialogue before data input | Landing CTA | Onboarding CTA | High |
| 04 | `Onboarding / Social Login` | `04_onboarding_step0_login.png` | `01_Entry_Onboarding` | Social login or guest selection | Chat intro CTA | Continue as guest / social login | High |
| 05 | `Onboarding / Profile` | `05_onboarding_step1_profile.png` | `01_Entry_Onboarding` | Name and gender entry | Step 04 complete | Next CTA | High |
| 06 | `Onboarding / Concern` | `06_onboarding_step2_concern.png` | `01_Entry_Onboarding` | Select major concern category | Step 05 complete | Next CTA | Medium |
| 07 | `Onboarding / Birth` | `07_onboarding_step3_birth.png` | `01_Entry_Onboarding` | Birth date and time entry | Step 06 complete | Analyze CTA | High |
| 08 | `Analyzing` | `08_analyzing.png` | `01_Entry_Onboarding` | Loading / transition state while analysis runs | Step 07 complete | Analysis complete | High |
| 09 | `Chat Main` | `09_chat_main.png` | `01_Entry_Onboarding` | First analysis result and main chat state | Analyze finish | Tab navigation / chat input | High |
| 10 | `Home` | `10_home.png` | `02_Core_Navigation` | Main home tab with 3D scene and daily insight | Bottom tab: Home | Open scene menu / other tabs | High |
| 11 | `Home / Scene Menu` | `11_home_scene_menu.png` | `02_Core_Navigation` | 3D scene selector overlay | Home scene button | Select scene / close | Medium |
| 12 | `Calendar` | `12_calendar.png` | `02_Core_Navigation` | Calendar tab main view | Bottom tab: Calendar | Open day detail | Medium |
| 13 | `Calendar / Day Sheet` | `13_calendar_detail_sheet.png` | `02_Core_Navigation` | Calendar date detail bottom sheet | Tap date | Close sheet | Medium |
| 14 | `Profile` | `14_profile.png` | `02_Core_Navigation` | Profile and settings root | Bottom tab: Profile | Open switcher / settings / report | High |
| 15 | `Profile / Switcher` | `15_profile_switcher.png` | `03_Profile_Account_Flows` | Profile switcher modal | Profile switcher card | Select / add / close | Medium |
| 16 | `Profile / Add Modal` | `16_profile_add_modal.png` | `03_Profile_Account_Flows` | Add secondary profile modal | Tap add profile | Save / close | Medium |
| 17 | `Profile / Switcher + Added` | `17_profile_switcher_with_added_profile.png` | `03_Profile_Account_Flows` | Switcher state after adding profile | Add flow complete | Select / upgrade | Low |
| 18 | `Profile / Upgrade Modal` | `18_profile_upgrade_modal.png` | `03_Profile_Account_Flows` | Premium upsell modal | Tap locked profile slot | Close / upgrade CTA | Medium |
| 19 | `Profile / Edit Modal` | `19_profile_edit_modal.png` | `03_Profile_Account_Flows` | Edit profile modal | Tap profile setting row | Save / close | Medium |
| 20 | `Mini Apps` | `20_miniapps.png` | `02_Core_Navigation` | Mini apps entry grid | Bottom tab: Mini Apps | Open couple / dream | High |
| 21 | `Couple / Partner Select` | `21_miniapps_couple_select_modal.png` | `04_MiniApp_Flows` | Choose partner profile for compatibility | Tap couple app | Select partner / close | Medium |
| 22 | `Couple / Input` | `22_miniapps_couple_input.png` | `04_MiniApp_Flows` | Couple app pre-analysis screen | Partner selected | Analyze CTA | Medium |
| 23 | `Couple / Analyzing` | `23_miniapps_couple_analyzing.png` | `04_MiniApp_Flows` | Couple analysis loading state | Analyze CTA | Result complete | Medium |
| 24 | `Couple / Result` | `24_miniapps_couple_result.png` | `04_MiniApp_Flows` | Couple analysis result screen | Analysis complete | Retry / back | High |
| 25 | `Dream / Input` | `25_miniapps_dream_input.png` | `04_MiniApp_Flows` | Dream text input screen | Tap dream app | Analyze CTA | Medium |
| 26 | `Dream / Pending` | `26_miniapps_dream_pending.png` | `04_MiniApp_Flows` | Post-submit transitional state | Analyze CTA | Dream result | Low |

## 3. Suggested Figma Sections Inside Each Page

| Figma Page | Section Name | Contains | Recommended Layout |
|---|---|---|---|
| `01_Entry_Onboarding` | `A. Entry` | `01`, `02`, `03` | Horizontal row |
| `01_Entry_Onboarding` | `B. Onboarding Steps` | `04`, `05`, `06`, `07` | Horizontal row |
| `01_Entry_Onboarding` | `C. Transition and Result` | `08`, `09` | Horizontal row |
| `02_Core_Navigation` | `A. Home` | `10`, `11` | Vertical stack |
| `02_Core_Navigation` | `B. Calendar` | `12`, `13` | Vertical stack |
| `02_Core_Navigation` | `C. Profile and Mini Apps Roots` | `14`, `20` | Horizontal row |
| `03_Profile_Account_Flows` | `A. Profile Switching` | `15`, `16`, `17` | Horizontal row |
| `03_Profile_Account_Flows` | `B. Monetization and Edit` | `18`, `19` | Horizontal row |
| `04_MiniApp_Flows` | `A. Couple Flow` | `21`, `22`, `23`, `24` | Horizontal row |
| `04_MiniApp_Flows` | `B. Dream Flow` | `25`, `26` | Horizontal row |

## 4. Componentization Guide

| Component Group | Seen In Frames | Make As Figma Component? | Notes |
|---|---|---|---|
| Top app header | `02`, `10`, `12`, `14`, `20`, `25`, `26` | Yes | Keep icon, title, top-right button variants together. |
| Primary universe CTA | `02`, `03`, `07`, `25`, `26` | Yes | Use variants for enabled, disabled, loading. |
| Bottom tab bar | `09`, `10`, `12`, `14`, `20`, `25`, `26` | Yes | Build active-state variants per tab. |
| Glass card container | `10`, `12`, `14`, `20`, `24` | Yes | Reuse for home cards and results. |
| Modal shell | `11`, `13`, `15`, `16`, `18`, `19`, `21` | Yes | Same backdrop logic, different content bodies. |
| Coin chip | `20`, `22`, `25`, `26` | Yes | Reuse with free/paid states later if needed. |
| Profile avatar tile | `14`, `15`, `17`, `21`, `22`, `23` | Yes | Reusable across profile switcher and couple flow. |

## 5. Prototype Connection Guide

| From Frame | Interaction | To Frame | Transition Suggestion |
|---|---|---|---|
| `Intro` | Skip / finish | `Landing` | Dissolve |
| `Landing` | Start CTA | `Chat Intro` | Smart animate |
| `Chat Intro` | Onboarding CTA | `Onboarding / Social Login` | Smart animate |
| `Onboarding / Social Login` | Continue | `Onboarding / Profile` | Slide left |
| `Onboarding / Profile` | Next | `Onboarding / Concern` | Slide left |
| `Onboarding / Concern` | Next | `Onboarding / Birth` | Slide left |
| `Onboarding / Birth` | Analyze | `Analyzing` | Dissolve |
| `Analyzing` | Finish | `Chat Main` | Dissolve |
| `Chat Main` | Home tab | `Home` | Instant |
| `Home` | Scene menu | `Home / Scene Menu` | Move in |
| `Calendar` | Day tap | `Calendar / Day Sheet` | Move in |
| `Profile` | Switcher | `Profile / Switcher` | Move in |
| `Profile / Switcher` | Add profile | `Profile / Add Modal` | Open overlay |
| `Profile / Switcher + Added` | Locked slot | `Profile / Upgrade Modal` | Open overlay |
| `Mini Apps` | Couple | `Couple / Partner Select` | Move in |
| `Couple / Partner Select` | Select partner | `Couple / Input` | Instant |
| `Couple / Input` | Analyze | `Couple / Analyzing` | Dissolve |
| `Couple / Analyzing` | Result ready | `Couple / Result` | Dissolve |
| `Mini Apps` | Dream | `Dream / Input` | Move in |
| `Dream / Input` | Analyze | `Dream / Pending` | Dissolve |

## 6. Known Capture Gap

| Missing or Imperfect Capture | Current Replacement | Recommended Follow-up |
|---|---|---|
| Dream final result screen | `26_miniapps_dream_pending.png` | Recapture dream result if a final showcase frame is required in Figma |

