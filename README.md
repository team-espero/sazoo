<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sazoo v2.1 Forest

Premium AI-powered saju app with onboarding, home sanctuary, AI chat, mini apps, invite flow, currency system, and launch-ready backend support.

## Local Development

**Prerequisites:** Node.js 22+

1. Install dependencies
   `npm install`
2. Create `.env.local` from the example files and set the required keys
3. Start the web app
   `npm run dev`
4. Start the API server in another terminal if needed
   `npm run server:start`

## Core Commands

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run qa:memory:store`
- `npm run qa:launch-db`
- `npm run ci:gemini` (requires `GEMINI_API_KEY`)

## Git Bootstrap

This workspace is prepared for Git, but remote connection is still user-owned.

Recommended first commands after you create the remote repository:

```bash
git init -b main
git remote add origin <REMOTE_URL>
git add .
git commit -m "chore: bootstrap sazoo repository"
git push -u origin main
```

## Branch / PR / Release Rules

See:
- `docs/deploy/11-git-workflow.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

## Notes

- Current CI intentionally excludes `npm run typecheck` because the project still hits Node heap OOM on full TypeScript checking.
- Re-enable typecheck in CI only after the TS memory issue is fixed.
