# Sazoo Git Workflow

## Branch Strategy

- `main`: production-ready branch only
- `develop`: optional integration branch if the team needs batch release prep
- `codex/<short-task-name>`: implementation branches for Codex-driven work
- `feature/<short-task-name>`: manual feature branches
- `fix/<short-task-name>`: bug fix branches
- `release/vX.Y.Z`: release hardening branch when needed
- `hotfix/<short-task-name>`: urgent production fix branch

## Merge Rules

- Never commit directly to `main`
- Open a PR for every change into `main`
- Require at least one review before merge
- Squash merge by default to keep history readable
- Rebase or update branch before merge if CI is stale

## Branch Protection For `main`

Enable these settings in the remote provider after the repo is connected:

- Require pull request before merging
- Require 1 approval
- Dismiss stale approvals on new commits
- Require status checks to pass before merging
- Require branch to be up to date before merging
- Block force pushes
- Block branch deletion

Detailed setup guide:

- `docs/deploy/13-github-branch-protection.md`

## Required Status Checks

Use these once the repo is connected:

- `verify`
- `deploy-staging` only if staging deployment becomes mandatory on merge

## Commit Style

Use short conventional prefixes:

- `feat:` new behavior
- `fix:` bug fix
- `refactor:` structural change without behavior change
- `perf:` performance improvement
- `docs:` documentation only
- `build:` tooling or pipeline change
- `test:` tests only
- `chore:` maintenance

Examples:

- `feat: add server-backed profile memory promotion`
- `fix: stabilize miniapp dream fallback length`
- `build: prepare github workflow for main branch protection`

## Release Tagging Convention

- Production release tags: `vX.Y.Z`
- Release candidate tags if needed: `vX.Y.Z-rc.1`
- Tag only from `main`
- Tag after production env values and release notes are confirmed

## First-Time Remote Setup

Run these locally after you create the remote:

```bash
git remote add origin <REMOTE_URL>
git branch -M main
git push -u origin main
```

## Notes

- `typecheck` is not part of the required CI gate yet because the current project still OOMs on full TypeScript checking.
- Re-enable it only after the TypeScript memory issue is resolved.
