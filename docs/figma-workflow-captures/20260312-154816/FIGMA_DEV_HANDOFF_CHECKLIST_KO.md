# Sazoo 피그마 개발 Handoff 체크리스트

이 문서는 피그마 시안을 개발로 넘기기 전, 실제 handoff 준비 상태를 빠르게 점검하기 위한 체크리스트입니다.

## 1. 파일 구조 체크

| 체크 항목 | 완료 기준 |
|---|---|
| 페이지 생성 완료 | `01_Entry_Onboarding` ~ `04_MiniApp_Flows` 4개 페이지가 모두 존재함 |
| 커버 프레임 생성 완료 | 각 페이지에 `Cover / ...` 프레임이 1개씩 있음 |
| 프레임 네이밍 정리 | 주요 화면 프레임이 `FRM / ...` 규칙으로 정리되어 있음 |
| 컴포넌트 네이밍 정리 | 재사용 컴포넌트가 `CMP / ...` 규칙으로 정리되어 있음 |
| 섹션 네이밍 정리 | 주요 섹션이 `SEC / ...` 규칙으로 정리되어 있음 |

## 2. 화면 구성 체크

| 체크 항목 | 완료 기준 |
|---|---|
| 온보딩 플로우 연결 | Intro -> Landing -> Chat Intro -> Onboarding -> Analyzing -> Chat Main 흐름이 연결됨 |
| 메인 탭 구조 정리 | Home, Calendar, Profile, Mini Apps 루트 화면이 정리됨 |
| 프로필 모달 흐름 정리 | Switcher, Add, Upgrade, Edit 모달이 분리됨 |
| 미니앱 흐름 정리 | Couple 플로우와 Dream 입력 플로우가 구분됨 |
| 캡처 갭 메모 포함 | Dream final result 미포함 사실이 문서 또는 노트에 표시됨 |

## 3. 컴포넌트화 체크

| 체크 항목 | 완료 기준 |
|---|---|
| 상단 헤더 컴포넌트화 | 모든 주요 화면에서 동일 header instance를 사용함 |
| 하단 탭바 컴포넌트화 | 메인 화면에서 bottom tab bar가 공통 instance임 |
| 메인 CTA 컴포넌트화 | Universe CTA가 버튼 컴포넌트로 분리됨 |
| 글래스 카드 컴포넌트화 | 홈/프로필/결과 카드에 공통 card shell 적용 |
| 모달 쉘 컴포넌트화 | 모달, 시트, dim layer 구조가 공통화됨 |
| 아바타/코인칩 분리 | 프로필 avatar, coin chip이 개별 컴포넌트로 분리됨 |

## 4. Variant 체크

| 체크 항목 | 완료 기준 |
|---|---|
| 버튼 상태 정의 | `Enabled`, `Disabled`, `Loading`, `Pressed`가 있음 |
| 탭 상태 정의 | `Active`, `Inactive`, `Locked`가 있음 |
| 카드 상태 정의 | `Default`, `Expanded`, `Locked`가 필요 범위에서 정리됨 |
| 모달 상태 정의 | `Open`, `Closed` 또는 open note가 있음 |
| 언어 확장 메모 | `KO`, `EN`, `JA` 확장 포인트가 표시됨 |
| 테마 확장 메모 | `Light`, `Dark` 대응 여부가 메모됨 |

## 5. 레이어 구조 체크

| 체크 항목 | 완료 기준 |
|---|---|
| 배경 레이어 분리 | `01_Background`가 분리되어 있음 |
| 헤더 레이어 분리 | `03_Header`가 독립 그룹임 |
| 콘텐츠 레이어 분리 | `04_Content` 안에 카드/폼/리스트가 정리됨 |
| 오버레이 레이어 분리 | `07_Overlay`에 모달/시트가 들어감 |
| 주석 레이어 분리 | `08_Annotations`에 redline, behavior note가 있음 |
| 원본 PNG 숨김 가능 | `99_Reference` 레이어를 별도로 토글 가능함 |

## 6. 개발 전달 메모 체크

| 체크 항목 | 완료 기준 |
|---|---|
| 코드 파일 연결 | 주요 컴포넌트별 구현 파일이 문서에 적혀 있음 |
| 상태 메모 포함 | 로그인 상태, 코인 상태, API 대기 상태가 적혀 있음 |
| 인터랙션 메모 포함 | 탭 이동, 모달 오픈, 분석 시작 등 행동이 적혀 있음 |
| 우선순위 표시 | `필수`, `선택`, `추후`가 구분되어 있음 |
| 구현 갭 표시 | 아직 미완성 또는 재캡처 필요한 부분이 표시됨 |

## 7. 최종 전달 직전 확인

| 체크 항목 | 완료 기준 |
|---|---|
| 커버 프레임 문구 입력 | 각 페이지 cover에 제목, 부제, 설명이 들어감 |
| 프로토타입 링크 연결 | 핵심 흐름 링크가 최소 1차 연결됨 |
| 컴포넌트 인벤토리 동기화 | 최신 컴포넌트 문서와 피그마 파일 이름이 맞음 |
| 개발 전달 준비 완료 | 디자이너 외 다른 팀원도 파일 구조를 바로 이해할 수 있음 |

## 8. 함께 보면 좋은 문서

- `FIGMA_ONE_PAGE_SUMMARY_KO.md`
- `FIGMA_LAYER_STRUCTURE_RULES_KO.md`
- `FIGMA_COMPONENT_INVENTORY_KO.md`
- `FIGMA_PAGE_STRUCTURE_TABLE.md`
