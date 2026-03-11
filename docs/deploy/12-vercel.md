# Vercel Deployment

## Deployment shape

- Frontend: static Vite build from `dist`
- API: Vercel Node Function at `/api/index.js`
- Runtime note: local file and SQLite writes fall back to `/tmp/sazoo-data` on Vercel, so this is safe for preview/demo deploys but not a durable production database layer

## Required Vercel environment variables

### Client build variables

- `VITE_APP_ENV=prod`
- `VITE_API_BASE_URL=/api/v1`
- `VITE_API_TIMEOUT_MS=65000`
- `VITE_BASE_PATH=/`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Server-only variables

- `NODE_ENV=production`
- `API_PREFIX=/api/v1`
- `GEMINI_API_KEY`
- `GEMINI_CHAT_MODEL=gemini-2.5-flash`
- `GEMINI_INSIGHTS_MODEL=gemini-2.5-flash-lite`
- `CORS_ORIGINS=https://<your-vercel-domain>`
- `RATE_LIMIT_WINDOW_MS=60000`
- `RATE_LIMIT_MAX=100`
- `LOG_LEVEL=info`

## Security rule

- `GEMINI_API_KEY` must be added only in Vercel `Environment Variables`
- never create `VITE_GEMINI_API_KEY`
- never commit `.env.local`

## Link and deploy

```powershell
npx vercel link
npx vercel env add GEMINI_API_KEY production
npx vercel env add GEMINI_API_KEY preview
npx vercel --prod
```

## Preview automation

Current preview automation uses GitHub Actions plus the Vercel CLI.

Reason:
- direct Vercel Git integration to `team-espero/sazoo` is not currently available from the connected Vercel account context
- GitHub Actions provides a stable fallback that still creates preview deployments for branch pushes and pull requests

Required GitHub repository configuration:

- Actions secret: `VERCEL_TOKEN`
- Actions variable: `VERCEL_ORG_ID`
- Actions variable: `VERCEL_PROJECT_ID`

Workflow:

- `.github/workflows/vercel-preview.yml`

Behavior:

- branch pushes trigger a preview deployment
- pull requests trigger a preview deployment
- PR runs update a comment with the preview URL

## Post-deploy checks

```powershell
curl https://<your-vercel-domain>/health
curl -X POST https://<your-vercel-domain>/api/v1/fortune/chat `
  -H "Content-Type: application/json" `
  -d "{""installationId"":""qa"",""language"":""ko"",""profile"":{""id"":""qa-profile"",""name"":""QA""},""saju"":{""year"":""갑자"",""month"":""을축"",""day"":""병인"",""hour"":""정묘""},""question"":""오늘 운세를 알려줘""}"
```
