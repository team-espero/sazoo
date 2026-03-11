# GitHub Main Branch Protection Guide

This guide is the exact setup reference for protecting `main` in the `team-espero/sazoo` repository.

## Current Status

As of `2026-03-11`, the repository was switched to `public` and `main` branch protection was successfully applied.

Applied protection:
- required status check: `verify`
- require branch to be up to date: enabled
- require pull request before merge: enabled
- required approvals: `1`
- dismiss stale approvals: enabled
- require conversation resolution: enabled
- force pushes: blocked
- branch deletion: blocked

## Recommended Approach

Use a GitHub `ruleset` for `main` when available.

Why:
- GitHub recommends rulesets as the more flexible replacement for many branch protection use cases.
- Rulesets are easier to expand later when we add stricter release controls or deployment gates.
- If rulesets are unavailable or unnecessary for the current repository, use classic branch protection with the same requirements.

References:
- [About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [Create rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)
- [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

## Repository Baseline

Current repository assumptions:
- owner: `team-espero`
- repository: `sazoo`
- protected branch target: `main`
- primary required CI check: `verify`
- current deploy jobs are not required merge gates

## Pre-Flight Checklist

Before opening GitHub settings, confirm:

- [x] Remote repository is connected
- [x] `main` exists and is the default branch
- [x] GitHub Actions CI workflow exists
- [x] Required CI job name is known: `verify`
- [ ] You have repository admin access

## Recommended Ruleset Values

Create one branch ruleset for `main` with these values.

### Name And Target

- Ruleset name: `Protect main`
- Enforcement status: `Active`
- Target: `Branch`
- Branch target pattern: `main`

### Rules To Enable

Enable these rules:

- Restrict deletions
- Block force pushes
- Require a pull request before merging
- Require approvals: `1`
- Dismiss stale pull request approvals when new commits are pushed
- Require conversation resolution before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging

### Required Status Checks

Mark these as required:

- `verify`

Do not require these yet:

- `deploy-staging`
- `deploy-production`

Reason:
- They are not part of the current mandatory merge gate.
- Making them required now would block routine development without improving safety enough.

### Bypass Settings

Recommended now:

- Keep bypass list empty unless you explicitly want emergency maintainers to skip rules.

This is an implementation choice for this repo, not a GitHub requirement.

## GitHub UI Click Path

Open the repository and go to:

1. `Settings`
2. `Rules`
3. `Rulesets`
4. `New ruleset`
5. `New branch ruleset`

Then configure it with the values above.

## Step-By-Step Setup

1. Open `team-espero/sazoo` on GitHub.
2. Click `Settings`.
3. In the left sidebar, click `Rules`, then `Rulesets`.
4. Click `New ruleset`.
5. Click `New branch ruleset`.
6. Set `Ruleset name` to `Protect main`.
7. Set `Enforcement status` to `Active`.
8. Under branch targeting, target `main`.
9. Turn on `Restrict deletions`.
10. Turn on `Block force pushes`.
11. Turn on `Require a pull request before merging`.
12. Inside pull request requirements:
    - set required approvals to `1`
    - turn on stale approval dismissal
    - turn on conversation resolution
13. Turn on `Require status checks to pass`.
14. Add `verify` as the required status check.
15. Turn on `Require branches to be up to date before merging`.
16. Leave bypass actors empty unless you have an emergency exception policy.
17. Save the ruleset.

## Verification Checklist

After saving, verify the rule is actually working:

- [ ] Open a test branch from `main`
- [ ] Push a small harmless docs-only commit
- [ ] Open a PR into `main`
- [ ] Confirm merge is blocked until `verify` finishes
- [ ] Confirm merge is blocked until at least one approval is added
- [ ] Push one more commit to the same PR
- [ ] Confirm old approval is dismissed
- [ ] Try a direct push to `main` and confirm it is rejected

## What To Watch For

Common setup mistakes:

- Adding the workflow file name instead of the job name
  - required check should be `verify`, not `CI`
- Requiring deployment jobs too early
  - this slows down normal merges and creates false blockers
- Leaving `main` unprotected because preview deploys already exist
  - Vercel preview does not replace branch protection
- Using classic branch protection and forgetting to migrate the same rules later

## Recommended Follow-Up

After branch protection is enabled, do these next:

1. Turn on Vercel Git integration preview deployments for pull requests
2. Add a custom production domain when the domain is available
3. Revisit required checks once TypeScript `typecheck` is stable enough to join CI

## Completion Definition

This task is complete only when:

- a ruleset exists for `main`
- PR approval is required
- `verify` is a required check
- direct unsafe updates to `main` are blocked
- the verification checklist above has been run once
