# RELEASE MATRIX

## Platform Matrix

| Platform | Build Path | Release Path | Account/Access | Required Assets | Status |
|---|---|---|---|---|---|
| Web (Staging) | `npm run build` + static hosting | staging URL | Hosting credentials, domain | favicon, OG image | Planned |
| Web (Prod) | `npm run build` + static hosting | production URL | Hosting credentials, domain, TLS | SEO/meta config | Planned |
| Android | `npm run build` -> `npx cap sync android` -> Android Studio build | Play Console Internal -> Closed -> Production | Google Play Developer Account, keystore | app icon, feature graphic, screenshots, privacy policy | Planned |
| iOS | `npm run build` -> `npx cap sync ios` -> Xcode archive | TestFlight -> App Store | Apple Developer Account, certificates/profiles | app icon, screenshots, privacy policy, app review notes | Planned |

## Environment Route

| Env | API Base URL | Frontend Build Command | Backend Run Command | Deploy Trigger |
|---|---|---|---|---|
| dev | `http://localhost:8787/api/v1` | `npm run dev` | `npm run server:dev` | local only |
| staging | `https://staging-api.example.com/api/v1` | `npm run build:staging` | `npm run server:start` | merge to `main` |
| prod | `https://api.example.com/api/v1` | `npm run build:prod` | `npm run server:start` | tag `v*` |

## Mandatory Pre-Release Checklist
1. Secrets configured in CI/CD (no client-side key exposure)
2. `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` green
3. Staging smoke test passed (chat + daily-insights + onboarding)
4. Privacy policy / terms / store metadata complete
5. Rollback plan and on-call owner fixed
