# 01 Baseline Audit (2026-03-08)

## Scope
- Workspace: `C:\Users\user\Desktop\바탕화면 모음\codex\sazoo-v2.1-forest`
- Goal: 모바일 앱 배포 전 현재 상태 진단

## Commands Run
1. `npm run dev -- --host 127.0.0.1 --port 4173`
- Result: **PASS**
- Evidence: `docs/deploy/dev-check.log`

2. `npm run build`
- Result: **FAIL**
- Evidence: `docs/deploy/build-check.full.log`
- Exit code: `-1073740791`
- Last log lines:
  - `/index.css doesn't exist at build time, it will remain unchanged to be resolved at runtime`
  - `transforming...`
  - `✓ 2646 modules transformed.`

## Findings (Priority)

### P0 (Release Blockers)
1. Frontend에 Gemini API 키 직접 사용
- Files: `context.tsx`, `screens/tabs/ChatScreen.tsx`, `.env.local`
- Risk: 번들/클라이언트 노출 가능성 및 키 유출

2. Production build 비정상 종료
- File: `package.json`, `vite.config.ts`
- Risk: 배포 아티팩트 생성 불가

3. Backend API relay 부재
- Current: 클라이언트에서 LLM 직접 호출
- Risk: 보안/레이트리밋/운영 통제 불가

### P1 (Should Fix Before Store Submission)
1. 환경 분리(dev/staging/prod) 구조 부재
2. lint/typecheck/test/CI 품질 게이트 부재
3. 배포/스토어/런북 문서 부재

### P2 (Improvements)
1. 릴리즈 노트/Go-Live 체크리스트 템플릿 자동화
2. 스토어 메타데이터 및 스크린샷 자산 준비 체크리스트 정교화
3. Capacitor iOS 실기기 배포 단계 표준화

## Root Cause Hypotheses for Build Failure
1. `vite`, `@vitejs/plugin-react` 버전 중복/충돌
2. React compiler plugin 설정과 현재 환경의 비호환
3. 불필요한/중복 빌드 설정으로 인한 번들 단계 비정상 종료

## Next Step
- 단위 02~12를 순차 수행하며 P0부터 제거
