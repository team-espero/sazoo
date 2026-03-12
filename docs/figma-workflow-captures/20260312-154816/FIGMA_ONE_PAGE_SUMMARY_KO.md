# Sazoo 피그마 원페이지 요약본

피그마에서 바로 옆에 띄워두고 작업할 수 있도록, 현재 앱 워크플로우를 한 페이지 기준으로 압축한 문서입니다.

## 1. 피그마 페이지 구조

| 피그마 페이지 | 추천 커버 프레임 이름 | 포함 프레임 |
|---|---|---|
| `01_Entry_Onboarding` | `Cover / 진입 & 온보딩` | `01 Intro` → `02 Landing` → `03 Chat Intro` → `04 Social Login` → `05 Profile` → `06 Concern` → `07 Birth` → `08 Analyzing` → `09 Chat Main` |
| `02_Core_Navigation` | `Cover / 메인 탭 구조` | `10 Home`, `11 Home / Scene Menu`, `12 Calendar`, `13 Calendar / Day Sheet`, `14 Profile`, `20 Mini Apps` |
| `03_Profile_Account_Flows` | `Cover / 프로필 & 계정 플로우` | `15 Profile / Switcher`, `16 Add Modal`, `17 Switcher + Added`, `18 Upgrade Modal`, `19 Edit Modal` |
| `04_MiniApp_Flows` | `Cover / 미니앱 플로우` | `21 Couple / Partner Select` → `22 Couple / Input` → `23 Couple / Analyzing` → `24 Couple / Result`, `25 Dream / Input` → `26 Dream / Pending` |

## 2. 프레임 Import 순서

| 번호 | 프레임 이름 | PNG 파일 |
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

## 3. 핵심 프로토타입 연결

| 시작 프레임 | 이동 프레임 |
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

## 4. 컴포넌트로 분리할 것

| 컴포넌트 | 재사용 위치 |
|---|---|
| 상단 헤더 | Landing, Home, Calendar, Profile, Mini Apps, Dream |
| 메인 CTA 버튼 | Landing, Chat Intro, Onboarding, Dream |
| 하단 탭바 | Chat Main, Home, Calendar, Profile, Mini Apps, Dream |
| 글래스 카드 | Home, Calendar, Profile, Couple Result |
| 모달 쉘 | Scene Menu, Day Sheet, Profile Switcher, Add Modal, Upgrade Modal, Edit Modal, Partner Select |
| 엽전/코인 칩 | Mini Apps, Couple, Dream |
| 프로필 아바타 타일 | Profile 플로우, Couple 플로우 |

## 5. 페이지별 커버 프레임 구성 추천

| 피그마 페이지 | 커버 프레임 이름 | 커버 안에 넣을 정보 |
|---|---|---|
| `01_Entry_Onboarding` | `Cover / 진입 & 온보딩` | 페이지 제목, 핵심 흐름 `Intro -> Landing -> Onboarding -> Result`, 사용 프레임 수 |
| `02_Core_Navigation` | `Cover / 메인 탭 구조` | Home / Calendar / Profile / Mini Apps 탭 맵, 공통 헤더/탭바 컴포넌트 표시 |
| `03_Profile_Account_Flows` | `Cover / 프로필 & 계정 플로우` | 프로필 전환, 추가, 수정, 업그레이드 모달 흐름 |
| `04_MiniApp_Flows` | `Cover / 미니앱 플로우` | Couple 분석 플로우, Dream 입력 플로우, 결과 캡처 갭 메모 |

## 6. 커버 프레임 복붙용 문구

### `Cover / 진입 & 온보딩`

- 제목: `진입 & 온보딩`
- 부제: `첫 방문부터 첫 사주 결과 도달까지의 핵심 진입 플로우`
- 설명: `인트로, 랜딩, 캐릭터 첫 대화, 로그인/게스트 선택, 기본 정보 입력, 분석 화면, 첫 결과 진입까지를 한 흐름으로 정리합니다.`
- 보조 라벨:
  - `Frames 01-09`
  - `Primary Journey`
  - `First Value Flow`

### `Cover / 메인 탭 구조`

- 제목: `메인 탭 구조`
- 부제: `온보딩 이후 사용자가 가장 자주 머무는 핵심 탭 레이어`
- 설명: `Home, Calendar, Profile, Mini Apps의 메인 상태와 시트/메뉴 구조를 한 페이지에서 확인할 수 있도록 정리합니다.`
- 보조 라벨:
  - `Frames 10-14, 20`
  - `Core Navigation`
  - `Shared Shell`

### `Cover / 프로필 & 계정 플로우`

- 제목: `프로필 & 계정 플로우`
- 부제: `프로필 전환, 추가, 수정, 업그레이드 흐름`
- 설명: `멀티 프로필 구조와 계정 관련 모달 흐름을 분리해 관리하기 위한 상세 페이지입니다.`
- 보조 라벨:
  - `Frames 15-19`
  - `Account Layer`
  - `Modal Flow`

### `Cover / 미니앱 플로우`

- 제목: `미니앱 플로우`
- 부제: `궁합 분석과 해몽 미니앱의 입력-분석-결과 구조`
- 설명: `Couple mini-app의 완전한 흐름과 Dream mini-app의 입력/전이 상태를 정리한 페이지입니다.`
- 보조 라벨:
  - `Frames 21-26`
  - `Mini App Journey`
  - `Interactive Flow`

## 7. 피그마 컴포넌트 Naming Convention

### 기본 규칙

- 형식: `Prefix / Domain / Component / Variant / State`
- 예시: `CMP / Home / TopHeader / Default / Light`
- 띄어쓰기 대신 `/` 기준으로 계층을 맞춥니다.
- 같은 역할의 컴포넌트는 페이지별로 새로 만들지 말고 `Domain`만 바꿔 확장합니다.

### Prefix 규칙

| Prefix | 의미 | 예시 |
|---|---|---|
| `CVR` | 페이지 커버 프레임 | `CVR / EntryOnboarding / Default` |
| `FRM` | 실제 화면 프레임 | `FRM / Onboarding / BirthInput` |
| `CMP` | 재사용 UI 컴포넌트 | `CMP / Button / PrimaryCTA / Enabled` |
| `SEC` | 화면 내부 섹션 | `SEC / Home / DailyInsight` |
| `FLOW` | 프로토타입 연결용 흐름 묶음 | `FLOW / Couple / ResultPath` |
| `ICON` | 아이콘 컴포넌트 | `ICON / Tab / Home / Active` |
| `ILLUST` | 일러스트/비주얼 에셋 | `ILLUST / Character / Idle / Default` |

### 공통 컴포넌트 추천 이름

| 컴포넌트 종류 | 추천 이름 |
|---|---|
| 상단 헤더 | `CMP / Header / TopBar / Default` |
| 상단 헤더 로고형 | `CMP / Header / TopBar / WithLogo` |
| 메인 CTA 버튼 | `CMP / Button / UniverseCTA / Enabled` |
| 메인 CTA 버튼 비활성 | `CMP / Button / UniverseCTA / Disabled` |
| 하단 탭바 | `CMP / Navigation / BottomTabBar / Default` |
| 하단 탭 아이템 홈 활성 | `CMP / Navigation / TabItem / HomeActive` |
| 하단 탭 아이템 기본 | `CMP / Navigation / TabItem / Default` |
| 글래스 카드 | `CMP / Card / Glass / Default` |
| 오늘의 인사이트 카드 | `CMP / Card / DailyInsight / Default` |
| 코인 칩 | `CMP / Chip / Coin / Default` |
| 무료 코인 칩 | `CMP / Chip / Coin / FreePool` |
| 프로필 아바타 | `CMP / Avatar / Profile / Default` |
| 모달 쉘 | `CMP / Modal / Base / Default` |
| 바텀시트 쉘 | `CMP / Sheet / Bottom / Default` |

### 화면 프레임 추천 이름

| 화면 | 추천 프레임 이름 |
|---|---|
| 인트로 | `FRM / Entry / Intro` |
| 랜딩 | `FRM / Entry / Landing` |
| 첫 채팅 인트로 | `FRM / Chat / PreOnboarding` |
| 소셜 로그인 | `FRM / Onboarding / SocialLogin` |
| 이름/성별 | `FRM / Onboarding / Profile` |
| 고민 선택 | `FRM / Onboarding / Concern` |
| 생년월일 입력 | `FRM / Onboarding / BirthInput` |
| 분석 화면 | `FRM / Onboarding / Analyzing` |
| 메인 채팅 | `FRM / Chat / Main` |
| 홈 | `FRM / Home / Default` |
| 홈 씬 메뉴 | `FRM / Home / SceneMenu` |
| 캘린더 | `FRM / Calendar / Default` |
| 캘린더 바텀시트 | `FRM / Calendar / DaySheet` |
| 프로필 | `FRM / Profile / Default` |
| 프로필 스위처 | `FRM / Profile / Switcher` |
| 미니앱 메인 | `FRM / MiniApps / Default` |
| 궁합 결과 | `FRM / MiniApps / CoupleResult` |
| 해몽 입력 | `FRM / MiniApps / DreamInput` |

### Variants / State 규칙

| 목적 | 예시 |
|---|---|
| 버튼 상태 | `Enabled`, `Disabled`, `Loading`, `Pressed` |
| 탭 상태 | `Active`, `Inactive`, `Badge` |
| 카드 상태 | `Default`, `Expanded`, `Locked` |
| 모달 상태 | `Open`, `Closed` |
| 언어 버전 | `KO`, `EN`, `JA` |
| 테마 버전 | `Light`, `Dark` |

### 실무용 추천

- 페이지 커버는 `CVR` prefix로 고정하면 정렬이 깔끔합니다.
- 실제 화면은 `FRM` prefix를 쓰면 프로토타입 연결용 프레임만 빠르게 필터링할 수 있습니다.
- 컴포넌트는 `CMP / 영역 / 이름 / 상태`까지만 우선 쓰고, 너무 길어지면 `Variant`부터 생략합니다.
- 먼저 공통 컴포넌트를 만들고, 화면 프레임에서 instance로 연결하는 방식이 유지보수에 가장 유리합니다.

## 8. 작업 메모

- 캡처 기준 프레임 크기: `430 x 932`
- 총 캡처 수: `26`
- `Dream / Pending`은 최종 결과 화면이 아니라 제출 직후 상태입니다.
- PNG는 그대로 완성본으로 쓰기보다, 피그마에서 레이어를 다시 쌓는 기준 화면으로 사용하는 편이 좋습니다.

## 9. 함께 보면 좋은 문서

- `index.md`
- `FIGMA_HANDOFF.md`
- `FIGMA_PAGE_STRUCTURE_TABLE.md`
- `FIGMA_ONE_PAGE_SUMMARY.md`
- `FIGMA_LAYER_STRUCTURE_RULES_KO.md`
- `FIGMA_COMPONENT_INVENTORY_KO.md`
- `FIGMA_DEV_HANDOFF_CHECKLIST_KO.md`
