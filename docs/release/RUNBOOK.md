# RUNBOOK

## 1. Pre-Deploy
1. Confirm target version and changelog
2. Validate secrets/config in target environment
3. Run `npm run quality`
4. Ensure staging smoke test success

## 2. Deploy
1. Deploy backend first
2. Run `/health` check
3. Deploy frontend build
4. Run E2E smoke path:
   - app load
   - onboarding
   - chat response
   - daily insights

## 3. Monitoring
- Error rate (5xx)
- API latency (p95)
- Rate-limit spikes
- Client crash reports

## 4. Incident Response

### Severity Levels
- Sev1: service down / critical data issue
- Sev2: core function degraded
- Sev3: partial feature issue

### Immediate Actions
1. Acknowledge incident in team channel
2. Identify blast radius and affected users
3. Apply mitigation (rollback / traffic shift)
4. Post incident status update

## 5. Rollback
1. Re-deploy previous stable backend image/version
2. Re-point frontend to previous stable artifact
3. Validate smoke test on rolled-back version
4. Publish rollback note

## 6. Postmortem
- Timeline
- Root cause
- Corrective actions
- Prevention items
