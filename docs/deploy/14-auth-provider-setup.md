# Auth Provider Setup

Use this checklist when closing the remaining console-side auth tasks for production.

## Firebase Authentication

Add these to **Firebase Console > Authentication > Settings > Authorized domains**:

- `localhost`
- `127.0.0.1`
- `sazoo.vercel.app`
- any Vercel preview domain you actively use for QA

Current app behavior:
- Google login uses popup by default
- mobile-like environments fall back to redirect login
- if the domain is missing, the app shows an explicit unauthorized-domain error message instead of failing silently

## Kakao JavaScript SDK

Add a public client env value:

- `VITE_KAKAO_JAVASCRIPT_KEY`

For Vercel, add it to both:

- `preview`
- `production`

Then register allowed domains/origins in the Kakao developer console for:

- local dev origins you use
- `https://sazoo.vercel.app`
- any preview origins you want to test

Current app behavior:
- if the Kakao key is missing, the app keeps the Kakao button visible but explains that setup is pending
- once the Kakao key and allowed domains are configured, the same auth session model is used for Kakao and Google

## Merge Rule

Guest-to-account merge rule is now fixed in code:

- guest state stays usable without login
- when the user logs in with Google or Kakao, installation-scoped state is promoted to the authenticated `userId`
- promoted data includes user state, unlocks, chat summaries, and progressive profile memory

## QA Pass Criteria

- Google login succeeds on `https://sazoo.vercel.app`
- session survives a full reload
- logout returns the app to guest mode without losing the local profile snapshot
- Kakao login succeeds after key/domain setup
- Kakao session survives a full reload
