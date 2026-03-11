# ADR-0001: Mobile Deployment Architecture Decision

- Date: 2026-03-08
- Status: Accepted
- Decision Owner: App Team

## Context
현재 앱은 React + Vite + TypeScript 기반 웹 앱이며, 3D/애니메이션 자산과 기존 UI/상태관리 로직이 이미 구축되어 있다.
목표는 가장 짧은 시간 안에 Android/iOS 배포 가능한 앱 파이프라인을 확보하는 것이다.

## Options Considered
1. Capacitor (웹 코드 재사용)
2. React Native (신규 네이티브 코드베이스)
3. PWA (스토어 앱 대응 제한)

## Decision
**Capacitor 채택**

## Why
1. 기존 React 코드 재사용률이 가장 높아 리드타임 최소화
2. WebView 기반으로 현재 자산/컴포넌트(3D 포함) 이식 비용이 낮음
3. Android/iOS 스토어 패키징 경로를 빠르게 마련 가능
4. 필요 시 Capacitor 플러그인으로 네이티브 기능 점진 확장 가능

## Rejected Options and Reasons

### React Native
- 장점: 네이티브 렌더링 성능/에코시스템
- 제외 이유:
  1. UI/상태/로직 재작성 비용이 큼
  2. 현재 출시 일정과 맞지 않음
  3. 3D/애니메이션 자산 이식 난이도 증가

### PWA Only
- 장점: 구현 단순, 웹 배포 즉시 가능
- 제외 이유:
  1. 앱스토어/플레이스토어 제출 요구를 충족하지 못함
  2. OS 권한/푸시/스토어 메타 운영에서 제약이 큼

## Consequences

### Positive
- 빠른 출시 가능성 증가
- 기존 코드 투자 보호
- 단일 코드베이스 운영 가능

### Negative
- 복잡한 네이티브 기능에서 한계 가능성
- WebView 성능 튜닝 필요
- iOS 빌드는 macOS/Xcode 환경 의존

## Rollout Plan (주차 단위)
1. Week 1: 보안경계/API relay/빌드 안정화
2. Week 2: CI/CD + Capacitor Android 패키징 + 내부 배포
3. Week 3: iOS(macOS 환경) + 스토어 메타/정책/런북 정리
4. Week 4: 스테이징 리허설 + 출시
