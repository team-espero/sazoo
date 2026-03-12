# Sazoo 개발 Handoff용 컴포넌트 인벤토리

이 문서는 피그마 컴포넌트와 실제 코드 컴포넌트를 연결하기 위한 handoff 표입니다.

## 1. 우선순위 기준

| 분류 | 기준 |
|---|---|
| `필수` | 현재 피그마 워크플로우를 재구성하는 데 반드시 필요한 컴포넌트 |
| `선택` | 있으면 handoff 품질이 좋아지지만, 1차 구조 정리 없이도 진행 가능한 컴포넌트 |
| `추후` | 현재 캡처가 불완전하거나 운영/분석 성격이 강해서 나중에 추가해도 되는 컴포넌트 |

## 2. 공통 UI 컴포넌트

| 우선순위 | 피그마 이름 | 코드 컴포넌트 | 파일 | 용도 | 주요 Variant / State | 사용 위치 |
|---|---|---|---|---|---|---|
| `필수` | `CMP / Button / UniverseCTA / Enabled` | `Button` | `components.tsx` | 메인 CTA 버튼 | `primary`, `glass`, `kakao`, `google`, `ghost`, `disabled` | 랜딩, 온보딩, 드림 입력 |
| `필수` | `CMP / Avatar / Profile / Default` | `ProfileAvatar` | `components.tsx` | 프로필 아바타 | size, background variant | 프로필, 궁합, 스위처 |
| `필수` | `CMP / Card / Glass / Default` | `GlassCard` | `components.tsx` | 글래스 카드 셸 | clickable, noHover | 홈, 프로필, 결과 카드 |
| `필수` | `CMP / Input / TextField / Default` | `InputField` | `components.tsx` | 텍스트/숫자 입력 필드 | icon, label, type | 온보딩, 해몽, 프로필 수정 |
| `선택` | `CMP / Toggle / Jelly / Default` | `JellyToggle` | `components.tsx` | 온오프 토글 | on, off | 설정, 모션 토글 |
| `필수` | `CMP / Card / Gender / Default` | `GenderCard` | `components.tsx` | 성별 선택 카드 | male, female, selected | 온보딩 |
| `선택` | `CMP / Control / Segmented / Default` | `SegmentedControl` | `components.tsx` | 세그먼트 탭 | selected tab | 달력 종류, 기타 토글 |
| `필수` | `CMP / Tag / Cloud / Default` | `TagCloud` | `components.tsx` | 태그 선택 | selected / unselected | 고민 선택 |
| `필수` | `CMP / Picker / Wheel / Default` | `WheelPicker` | `components.tsx` | 휠 피커 | enabled / disabled | 생년월일 입력 |
| `선택` | `CMP / Text / Streaming / Default` | `StreamingText` | `components.tsx` | 타이핑 텍스트 | animate / static | 채팅 버블 |
| `필수` | `CMP / Header / TopBar / Default` | `FixedHeader` | `components.tsx` | 상단 헤더 | scrolled, notification | 홈 계열 |
| `필수` | `CMP / Navigation / BottomTabBar / Default` | `BottomNavigation` | `components.tsx` | 하단 탭바 | active tab, locked, pending | 메인 탭 전반 |

## 3. 홈 전용 컴포넌트

| 우선순위 | 피그마 이름 | 코드 컴포넌트 | 파일 | 용도 | 주요 Variant / State | 사용 위치 |
|---|---|---|---|---|---|---|
| `필수` | `CMP / Card / DailyInsight / Default` | `DailyFortuneCard` | `components.tsx` | 오늘의 운세 카드 | light/dark | Home |
| `필수` | `CMP / Card / LuckyItems / Default` | `LuckyItems` | `components.tsx` | 추천 아이템 목록 | loading / loaded | Home |
| `필수` | `CMP / Card / SajuGrid / Default` | `SajuGrid` | `components.tsx` | 사주 팔자 카드 | daily tip fallback | Home |
| `필수` | `CMP / Card / LuckyElement / Default` | `LuckyElementCard` | `components.tsx` | 오늘의 용신 카드 | loading / loaded | Home |
| `선택` | `CMP / Chart / Radar / Default` | `CustomRadarChart` | `components.tsx` | 오행 밸런스 차트 | data-driven | Home |
| `추후` | `CMP / Chart / TimeFlow / Default` | `TimeFlowChart` | `components.tsx` | 시간 흐름 차트 | data-driven | Home |
| `필수` | `SEC / Home / WelcomeSection` | `WelcomeSection` | `screens/tabs/HomeTab.tsx` | 상단 인사 영역 | language variant | Home |
| `필수` | `SEC / Home / LuckCycleTimeline` | `LuckCycleTimeline` | `screens/tabs/HomeTab.tsx` | 대운/연운 타임라인 | `1y`, `10y` | Home |
| `필수` | `SEC / Home / FiveElementsChart` | `FiveElementsChart` | `screens/tabs/HomeTab.tsx` | 오행 요약 섹션 | dark/light | Home |
| `선택` | `ILLUST / Scene / Home3D / Default` | `HomeScene` | `components/HomeScene.tsx` | 3D 메인 씬 | model variant | Home |

## 4. 채팅 전용 컴포넌트 / 섹션

| 우선순위 | 피그마 이름 | 코드 컴포넌트 | 파일 | 용도 | 주요 Variant / State | 사용 위치 |
|---|---|---|---|---|---|---|
| `선택` | `SEC / Chat / NavigationDrawer` | `NavigationDrawer` | `screens/tabs/ChatScreen.tsx` | 우측 드로어 메뉴 | open / close | Chat |
| `필수` | `CMP / Bubble / Paged / Default` | `PagedBubble` | `screens/tabs/ChatScreen.tsx` | 여러 페이지 텍스트 버블 | typing / completed | Chat |
| `필수` | `SEC / Chat / InitialReading` | `buildLocalInitialReading` | `screens/tabs/ChatScreen.tsx` | 첫 결과 생성 로직 기반 섹션 | local / server deepening | Chat |
| `필수` | `SEC / Chat / InputBar` | inline screen composition | `screens/tabs/ChatScreen.tsx` | 질문 입력 바 | empty / typing / sending | Chat |
| `선택` | `ILLUST / Character / Idle / Default` | chat character state | `screens/tabs/ChatScreen.tsx` | 캐릭터 아이들 영역 | idle / active | Chat |

## 5. 미니앱 전용 컴포넌트 / 섹션

| 우선순위 | 피그마 이름 | 코드 컴포넌트 | 파일 | 용도 | 주요 Variant / State | 사용 위치 |
|---|---|---|---|---|---|---|
| `필수` | `SEC / MiniApps / Grid` | `MiniAppsScreen` root grid | `screens/tabs/MiniAppsScreen.tsx` | 미니앱 진입 카드 그리드 | enabled / comingSoon | Mini Apps |
| `필수` | `CMP / Modal / PartnerSelect / Default` | `TargetSelectionModal` | `screens/tabs/MiniAppsScreen.tsx` | 궁합 상대 선택 모달 | empty / populated | Couple |
| `필수` | `SEC / MiniApps / CoupleInput` | `CoupleMatchingApp` | `screens/tabs/MiniAppsScreen.tsx` | 궁합 입력 화면 | no partner / ready | Couple |
| `필수` | `SEC / MiniApps / CoupleResult` | `CoupleMatchingApp` result state | `screens/tabs/MiniAppsScreen.tsx` | 궁합 결과 카드 | result / retry | Couple |
| `필수` | `SEC / MiniApps / DreamInput` | `DreamInterpretationApp` | `screens/tabs/MiniAppsScreen.tsx` | 해몽 입력 화면 | empty / typing / loading | Dream |
| `추후` | `SEC / MiniApps / DreamResult` | `DreamInterpretationApp` result state | `screens/tabs/MiniAppsScreen.tsx` | 해몽 결과 화면 | result | Dream |

## 6. 프로필 / 계정 플로우 컴포넌트

| 우선순위 | 피그마 이름 | 코드 컴포넌트 | 파일 | 용도 | 주요 Variant / State | 사용 위치 |
|---|---|---|---|---|---|---|
| `필수` | `SEC / Profile / Root` | `ProfileScreen` | `screens/tabs/ProfileScreen.tsx` | 프로필 메인 | logged in / guest | Profile |
| `필수` | `SEC / Profile / Switcher` | profile switcher flow | `screens/tabs/ProfileScreen.tsx` | 프로필 전환 | open / selected | Profile |
| `선택` | `CMP / Modal / AddProfile / Default` | add profile modal flow | `screens/tabs/ProfileScreen.tsx` | 새 프로필 추가 | empty / filled | Profile |
| `선택` | `CMP / Modal / Upgrade / Default` | premium upsell flow | `screens/tabs/ProfileScreen.tsx` | 프리미엄 업셀 | open / close | Profile |
| `선택` | `CMP / Modal / EditProfile / Default` | edit profile flow | `screens/tabs/ProfileScreen.tsx` | 프로필 수정 | editing / saved | Profile |
| `추후` | `SEC / Profile / LaunchMetrics` | launch metrics modal | `screens/tabs/ProfileScreen.tsx` | 운영 리포트 | loading / loaded | Profile |
| `필수` | `SEC / Profile / SpecialReports` | special reports section | `screens/tabs/ProfileScreen.tsx` | 초대 리포트 열람 | empty / unlocked | Profile |

## 7. 캘린더 전용 섹션

| 우선순위 | 피그마 이름 | 코드 컴포넌트 | 파일 | 용도 | 주요 Variant / State | 사용 위치 |
|---|---|---|---|---|---|---|
| `필수` | `SEC / Calendar / Root` | `CalendarScreen` | `screens/tabs/CalendarScreen.tsx` | 캘린더 메인 | month view | Calendar |
| `선택` | `CMP / Sheet / CalendarDay / Default` | day detail sheet flow | `screens/tabs/CalendarScreen.tsx` | 특정 날짜 상세 시트 | open / close | Calendar |

## 8. 개발 Handoff 컬럼 규칙

디자인에서 개발로 넘길 때는 아래 항목을 같이 적는 것을 권장합니다.

| 컬럼 | 의미 |
|---|---|
| `Figma Name` | 피그마 컴포넌트 이름 |
| `Code Component` | 실제 코드 컴포넌트 또는 섹션 이름 |
| `File` | 구현 파일 |
| `Props / State` | 개발에서 확인해야 하는 variant |
| `Used In` | 어느 화면에서 쓰이는지 |
| `Dev Note` | API, 조건부 노출, 상태 메모 |

## 9. 개발 전달 시 우선 체크할 것

| 체크 항목 | 설명 |
|---|---|
| 공통 컴포넌트 분리 여부 | Header, BottomNav, CTA, Card는 instance로 통일 |
| 상태별 variant 정의 여부 | active / disabled / loading / locked |
| 언어 variant 분리 여부 | KO / EN / JA |
| overlay 구조 분리 여부 | modal, sheet, dim layer 분리 |
| dev note 포함 여부 | API 응답, 로그인 조건, 코인 상태 등 표시 |

## 10. 함께 보면 좋은 문서

- `FIGMA_ONE_PAGE_SUMMARY_KO.md`
- `FIGMA_LAYER_STRUCTURE_RULES_KO.md`
- `FIGMA_PAGE_STRUCTURE_TABLE.md`
- `FIGMA_HANDOFF.md`
