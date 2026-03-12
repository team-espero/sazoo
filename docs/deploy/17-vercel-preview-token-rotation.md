# Vercel Preview Token Rotation Checklist

## Why this exists

The GitHub Actions workflow

- [/.github/workflows/vercel-preview.yml](C:/Users/user/Desktop/바탕화면%20모음/codex/sazoo-v2.1-forest-dashboard-secure/.github/workflows/vercel-preview.yml)

depends on the repository secret

- `VERCEL_TOKEN`

to call Vercel CLI against the `msjs-projects` scope.

The current failure pattern is:

```text
Error: You do not have access to the specified account
https://err.sh/vercel/scope-not-accessible
```

That means the token stored in GitHub does not belong to, or no longer has access to, the Vercel account/team that owns the project.

## Target state

After rotation, pull request previews should pass these workflow steps:

1. `vercel pull --environment=preview --scope=msjs-projects`
2. `vercel build --scope=msjs-projects`
3. `vercel deploy --prebuilt --scope=msjs-projects`

## What you need before rotating

1. A Vercel user account that can open the `msjs-projects` team or project.
2. GitHub admin access to the repository:
   - [https://github.com/team-espero/sazoo/settings/secrets/actions](https://github.com/team-espero/sazoo/settings/secrets/actions)
3. Optional but recommended access to the Vercel project:
   - [https://vercel.com/msjs-projects/sazoo](https://vercel.com/msjs-projects/sazoo)

## Rotation steps

### 1. Generate a new Vercel token

In Vercel:

1. Open [https://vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create a new token
3. Give it a clear label, for example:
   - `GitHub Actions Preview Deploy - sazoo`
4. Copy the token immediately

Important:
- Generate the token while logged into an account that actually has access to `msjs-projects`
- If the account only has personal projects, the token will fail again

### 2. Replace the GitHub secret

In GitHub:

1. Open [https://github.com/team-espero/sazoo/settings/secrets/actions](https://github.com/team-espero/sazoo/settings/secrets/actions)
2. Edit the repository secret `VERCEL_TOKEN`
3. Paste the new token
4. Save

### 3. Verify repository variables

Open [https://github.com/team-espero/sazoo/settings/variables/actions](https://github.com/team-espero/sazoo/settings/variables/actions)

Ensure both variables still match the linked Vercel project:

- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

If these point to the wrong project, preview deploys will still fail even with a valid token.

### 4. Re-run the preview workflow

Pick the latest failed PR run and re-run the workflow, or push a trivial branch update.

Expected result:

- `Validate Vercel Configuration`
- `Pull Vercel Preview Environment`
- `Build Project Artifacts`
- `Deploy Preview`

all succeed.

### 5. Confirm preview comment creation

On the pull request, the workflow should post or update a bot comment containing:

- `<!-- sazoo-vercel-preview -->`
- the preview URL

## Troubleshooting

### Failure: scope-not-accessible

Meaning:
- the token still does not have access to `msjs-projects`

Fix:
- create a new token from the correct Vercel account/team member

### Failure: missing VERCEL_ORG_ID or VERCEL_PROJECT_ID

Meaning:
- GitHub Actions variables are absent or wrong

Fix:
- re-link the project locally with:
  `npx vercel link`
- then copy the correct IDs into GitHub Actions variables

### Failure: preview builds locally but not in Actions

Meaning:
- the workflow is authenticating against the wrong team/project or using stale env linkage

Fix:
- confirm `VERCEL_SCOPE=msjs-projects`
- confirm [/.github/workflows/vercel-preview.yml](C:/Users/user/Desktop/바탕화면%20모음/codex/sazoo-v2.1-forest-dashboard-secure/.github/workflows/vercel-preview.yml) still writes `.vercel/project.json`

## Dashboard access env after token rotation

Once preview deploys work again, set or confirm these Vercel server env vars for preview and production:

- `DASHBOARD_ACCESS_KEY`
- `DASHBOARD_ALLOWED_EMAILS`

Recommended:
- use a strong passcode in `DASHBOARD_ACCESS_KEY`
- optionally restrict dashboard access further with a comma-separated email allowlist in `DASHBOARD_ALLOWED_EMAILS`
