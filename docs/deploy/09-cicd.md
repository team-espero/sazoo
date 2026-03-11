# 09 CI/CD

## Workflows Added
- `.github/workflows/ci.yml`
- `.github/workflows/staging-deploy.yml`
- `.github/workflows/production-deploy.yml`

## CI (PR/main)
- install (`npm ci`)
- lint
- typecheck
- test
- build (`BUILD_OUT_DIR=dist`)

## Staging Deploy
- Trigger: push to `main`
- Runs quality gates
- Triggers deploy webhook if `STAGING_DEPLOY_WEBHOOK` exists

## Production Deploy
- Trigger: tag push `v*`
- Builds and triggers webhook if `PRODUCTION_DEPLOY_WEBHOOK` exists

## Required Secrets
- `STAGING_DEPLOY_WEBHOOK`
- `PRODUCTION_DEPLOY_WEBHOOK`

## Notes
- 워크플로 문법은 GitHub Actions 표준 YAML 기준.
- 실제 인프라 배포 커맨드는 웹훅/플랫폼에 맞게 교체 가능.
