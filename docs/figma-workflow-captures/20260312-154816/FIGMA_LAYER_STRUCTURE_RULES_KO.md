# Sazoo 피그마 레이어 구조 규칙

이 문서는 현재 `Sazoo` 앱을 피그마로 재구성할 때, 프레임 내부 레이어를 일관된 방식으로 쌓기 위한 규칙 문서입니다.

기준 naming convention:

- `CVR / ...`
- `FRM / ...`
- `CMP / ...`
- `SEC / ...`
- `FLOW / ...`
- `ICON / ...`
- `ILLUST / ...`

## 1. 기본 원칙

- 모든 실제 화면은 `FRM / ...` 프레임 안에서 같은 레이어 순서를 유지합니다.
- 같은 역할의 요소는 페이지가 달라도 같은 그룹 이름을 사용합니다.
- 시각 요소와 인터랙션 메모를 섞지 않습니다.
- 배경, 콘텐츠, 오버레이, 노트는 반드시 분리합니다.
- 숫자 prefix를 붙여 레이어 정렬 순서를 고정합니다.

## 2. 화면 프레임 기본 구조

모든 `FRM / ...` 프레임은 아래 구조를 기본으로 합니다.

| 순서 | 레이어 이름 | 역할 | 비고 |
|---|---|---|---|
| `00_Frame` | 프레임 자체 | 최상위 화면 프레임 | 예: `FRM / Home / Default` |
| `01_Background` | 전체 배경 | 그라디언트, 배경색, 패턴 | 이미지/색상만 배치 |
| `02_SafeArea` | 안전영역 가이드 | status bar, notch, bottom inset 기준 | 숨김 토글 가능 |
| `03_Header` | 상단 헤더 | 로고, 타이틀, 우측 액션 | 공통 header instance 권장 |
| `04_Content` | 메인 콘텐츠 | 카드, 텍스트, 리스트, 입력필드 | 실제 핵심 화면 요소 |
| `05_Floating` | 부유 요소 | FAB, floating chip, character CTA | 필요 없으면 생략 가능 |
| `06_BottomNav` | 하단 탭바 | 탭 네비게이션 | 공통 bottom nav instance |
| `07_Overlay` | 모달/시트/토스트 | scene menu, modal, bottom sheet | 상태별 variant 가능 |
| `08_Annotations` | 주석/개발 메모 | redline, behavior note, dev handoff | 최종 시안에선 숨김 가능 |

## 3. 커버 프레임 구조

각 페이지의 커버 프레임은 실제 화면과 다르게 아래 구조를 권장합니다.

| 순서 | 레이어 이름 | 역할 |
|---|---|---|
| `01_CoverBackground` | 커버 배경 |
| `02_CoverTitle` | 페이지 제목 |
| `03_CoverSubtitle` | 페이지 설명 |
| `04_CoverMeta` | 프레임 범위, flow label |
| `05_CoverFlowMap` | 간단한 흐름 다이어그램 |
| `06_CoverNotes` | 중요 메모 |

예시:

- `CVR / EntryOnboarding / Default`
- `CVR / CoreNavigation / Default`

## 4. 콘텐츠 레이어 세부 규칙

`04_Content` 내부는 아래 구조로 나눕니다.

| 레이어 이름 | 용도 | 예시 |
|---|---|---|
| `04_Content / 01_Hero` | 상단 핵심 블록 | welcome text, main scene |
| `04_Content / 02_PrimaryCard` | 첫 번째 주요 카드 | daily insight, intro bubble |
| `04_Content / 03_SecondaryCard` | 두 번째 카드군 | element card, calendar card |
| `04_Content / 04_Form` | 입력 영역 | onboarding form, dream input |
| `04_Content / 05_List` | 반복 목록 | lucky items, profile list |
| `04_Content / 06_CTA` | 본문 안 CTA | analyze button, open modal |

권장:

- 카드가 2개 이상이면 `Card / 01`, `Card / 02` 식으로 순서를 붙입니다.
- 반복 요소는 `Item / 01`, `Item / 02`, `Item / 03` 형태로 정리합니다.

## 5. 모달 / 바텀시트 구조

`07_Overlay`는 아래 구조를 권장합니다.

| 순서 | 레이어 이름 | 역할 |
|---|---|---|
| `07_Overlay / 01_Backdrop` | dim layer |
| `07_Overlay / 02_Container` | 모달/시트 본체 |
| `07_Overlay / 03_Header` | 모달 타이틀, close 버튼 |
| `07_Overlay / 04_Content` | 내부 콘텐츠 |
| `07_Overlay / 05_Footer` | 확인/취소 CTA |

예시 이름:

- `CMP / Modal / Base / Default`
- `CMP / Sheet / Bottom / Default`
- `SEC / Profile / SwitcherModal`
- `SEC / Home / SceneMenu`

## 6. 헤더 / 탭바 레이어 규칙

### 헤더

| 레이어 이름 | 내용 |
|---|---|
| `03_Header / 01_Background` | blur, glass, bg |
| `03_Header / 02_Leading` | 로고, back button |
| `03_Header / 03_Title` | 페이지 타이틀 |
| `03_Header / 04_Trailing` | bell, menu, action button |

### 탭바

| 레이어 이름 | 내용 |
|---|---|
| `06_BottomNav / 01_Background` | tab bar shell |
| `06_BottomNav / 02_TabItems` | tab item instances |
| `06_BottomNav / 03_ActiveIndicator` | active pill / highlight |

## 7. 입력 화면 레이어 규칙

온보딩, 해몽 입력, 프로필 수정 등 폼 화면은 아래 규칙을 권장합니다.

| 레이어 이름 | 역할 |
|---|---|
| `04_Content / 01_TitleBlock` | 질문, 보조 설명 |
| `04_Content / 02_FieldGroup` | input field 묶음 |
| `04_Content / 03_SelectorGroup` | segmented control, tag cloud, gender card |
| `04_Content / 04_HelperText` | 안내 문구 |
| `04_Content / 05_PrimaryCTA` | 다음 단계 버튼 |

## 8. 이미지 트레이싱용 레이어 규칙

PNG를 베이스로 사용할 경우:

| 레이어 이름 | 역할 |
|---|---|
| `99_Reference / Screenshot` | 캡처 원본 |
| `99_Reference / Dim` | 원본을 흐리게 볼 때 사용하는 overlay |

권장:

- 최종 작업 후 `99_Reference`는 숨기고 실제 UI만 남깁니다.
- 원본 PNG 위에 바로 편집하지 말고, 새 레이어를 만들어 덮어씌웁니다.

## 9. 개발 handoff용 주석 규칙

`08_Annotations` 내부는 아래처럼 나눕니다.

| 레이어 이름 | 역할 |
|---|---|
| `08_Annotations / 01_Redlines` | spacing, margin, size |
| `08_Annotations / 02_BehaviorNotes` | modal open, tab switch, loading |
| `08_Annotations / 03_APIorStateNotes` | API, state, conditional UI |

예시 메모:

- `로그인 상태에서만 노출`
- `첫 진입 시 API 응답 대기`
- `무료 엽전 3개 기준 표시`

## 10. 페이지별 권장 레이어 템플릿

### `01_Entry_Onboarding`

- `01_Background`
- `03_Header`
- `04_Content / 01_Hero`
- `04_Content / 02_Form`
- `04_Content / 03_CTA`
- `07_Overlay`

### `02_Core_Navigation`

- `01_Background`
- `03_Header`
- `04_Content / 01_Hero`
- `04_Content / 02_PrimaryCard`
- `04_Content / 03_SecondaryCard`
- `05_Floating`
- `06_BottomNav`
- `07_Overlay`

### `03_Profile_Account_Flows`

- `01_Background`
- `03_Header`
- `04_Content / 01_List`
- `04_Content / 02_CTA`
- `07_Overlay / Modal`
- `08_Annotations`

### `04_MiniApp_Flows`

- `01_Background`
- `03_Header`
- `04_Content / 01_Input`
- `04_Content / 02_AnalysisState`
- `04_Content / 03_Result`
- `06_BottomNav`
- `07_Overlay`

## 11. 빠른 예시

예시 화면 구조:

```text
FRM / Home / Default
  01_Background
  02_SafeArea
  03_Header
    01_Background
    02_Leading
    03_Title
    04_Trailing
  04_Content
    01_Hero
    02_PrimaryCard
    03_SecondaryCard
  05_Floating
  06_BottomNav
  07_Overlay
  08_Annotations
```

## 12. 함께 보면 좋은 문서

- `FIGMA_ONE_PAGE_SUMMARY_KO.md`
- `FIGMA_PAGE_STRUCTURE_TABLE.md`
- `FIGMA_HANDOFF.md`
