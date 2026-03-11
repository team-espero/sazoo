# GO LIVE CHECKLIST

## Engineering
- [ ] `npm ci` succeeded
- [ ] `npm run quality` succeeded
- [ ] Backend `/health` ok
- [ ] Chat endpoint returns 200
- [ ] Daily-insights endpoint returns 200

## Security
- [ ] No frontend secret reference (source scan)
- [ ] CORS origins limited correctly
- [ ] Rate limit configured for production

## Mobile Packaging
- [ ] `npx cap sync` succeeded
- [ ] Android build prerequisites ready (JDK/SDK)
- [ ] iOS build prerequisites ready (macOS/Xcode/CocoaPods)

## Store Readiness
- [ ] Metadata (KO/EN) complete
- [ ] Privacy policy URL live
- [ ] Terms URL live
- [ ] Screenshots/icons complete

## Operations
- [ ] Rollback owner assigned
- [ ] Monitoring dashboard checked
- [ ] On-call contact confirmed

## Final Decision
- [ ] GO
- [ ] NO-GO

## Blocking P0 (if NO-GO)
- Production legal/support URLs are placeholders (`example.com`)
- Android build machine missing JDK (`JAVA_HOME` not set)
- iOS release machine prerequisites not ready (Xcode/CocoaPods)
- Deploy webhooks/secrets not configured in GitHub Actions
