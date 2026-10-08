# Plan #20: Production project + one-click "Deploy to production" workflow

> **Deferred to M8.** Merna deferred production on 2026-10-08 ([decision](https://github.com/merna550/tafsila/issues/20#issuecomment-6071264596), [ADR-026](../DECISIONS.md)): nothing to release yet, and it would use the last free Supabase project. #20 moved to "M8 - Beta & launch readiness" with `status:needs-plan` and is re-planned there. This plan is kept for reference only; do not build from it. The agent deny rules part was kept in M0 as #58.

Issue: #20 · plan:opus · build:sonnet · size:M · Milestone: M0 at planning time, now M8 · Depends on #19 (merged, PR #54)

## Context

M0 exit criterion 2: a production environment exists and only Merna can release to it with one click. Staging
(#19, ADR-023) already runs migrate → deploy → smoke on every merge to `main`. Production must reuse that pipeline,
run only on demand, and stay on free tiers (ADR-022). Three things in the issue text clash with existing decisions
and are resolved below instead of asking (ADR-022: a free, cheap-to-reverse alternative is chosen and logged).

## Decisions (one new ADR at build time; ADR-025 is now taken by #21)

1. **No GitHub Environment / required reviewer.** In a private repo on GitHub Free, environments need Pro/Team and
   required reviewers need Enterprise (paid, ADR-022). Free gate instead:
   - `workflow_dispatch` only; first job fails unless `github.actor == 'merna550'` **and** input `confirm == "deploy"`.
   - The agent PAT (`AGENT_GITHUB_TOKEN`) must never get `actions: write`, so no agent can dispatch it (written in
     the tutorial and the workflow header; a workflow test asserts no other workflow calls `deploy-production`).
   - `concurrency: production`, no cancel. Move to a real environment with reviewers when the plan allows (M8).
2. **Own Vercel Hobby project for production** (`tafsila-production`), **not connected to Git** (CLI deploys only,
   so PRs never preview there). ADR-023 said "real production at M8"; the M0 brief asks for the project now, free.
   Hobby's non-commercial rule is fine while it shows "coming soon"; ADR-014 (Pro before paying users) still applies.
3. **"Promote the exact staging build" = rebuild the exact staging SHA.** Vercel cannot promote a deployment across
   projects, and env vars differ per project. The workflow refuses a SHA unless `staging.yml` succeeded for it
   (GitHub API, `actions: read`). Default SHA = the `gitSha` currently reported by `$STAGING_URL/api/health`.
4. **Supabase production on Free** (2nd and last free project in the org). It may pause after 7 idle days; the
   coming-soon page does not touch the DB, and the workflow's `supabase link` step fails clearly if paused.
   No test OTP and no `config push` on production (ADR-024: OTP channel chosen at M8).
5. **Sign-ups flag = env var `SIGNUPS_OPEN`**, default `true` everywhere except `APP_ENV=production` (default
   `false`). PostHog flags (#21) can replace it later behind the `FeatureFlags` port. The production-only rule of
   ADR-021 (AI/Paymob keys required) now applies only when `APP_ENV=production` **and** sign-ups are open,
   otherwise the coming-soon production would fail `loadServerEnv()` at startup.
6. **Migrations are forward-only, "fix forward".** Rollback = Vercel Instant Rollback (dashboard or
   `vercel rollback`), never a DB rollback; migrations stay backward compatible for one release (ADR-023).
7. **Versions:** tags `vMAJOR.MINOR.PATCH`, first release `v0.1.0`; default = next patch of the latest tag.

## Changes

**Code**

- `packages/config/src/env.ts`: `SIGNUPS_OPEN` (`"true" | "false"`, optional) in the schema; `loadFeatureFlags(source)`
  → `{ signupsOpen }` (default by `APP_ENV`); the `superRefine` requires `PRODUCTION_REQUIRED_KEYS` only when
  production and sign-ups open. JSDoc on both.
- `apps/web/src/app/page.tsx`: when `signupsOpen` is false, show "قريباً" text instead of the "ابدئي الآن" button
  (server component reads `loadFeatureFlags()`; `export const dynamic = "force-dynamic"` so runtime env is used).
  Strings stay inline like today (no i18n setup yet).

**CI**

- New `.github/workflows/deploy-production.yml` (`workflow_dispatch`, inputs `sha` optional, `version` optional,
  `confirm` required; `permissions: contents: read`, release job `contents: write`, `actions: read`):
  1. `gate`: actor + confirm check; resolve SHA (input or staging health) and version (input or next tag);
     verify a successful `staging.yml` run for that SHA. Outputs `sha`, `version`.
  2. `checks` (needs gate): checkout `sha`, `pnpm install --frozen-lockfile`, `pnpm quality`, `pnpm test`.
  3. `migrate` (needs checks): `supabase link --project-ref "$SUPABASE_PROJECT_REF_PRODUCTION"` → `supabase db push`
     (never the seed). Same steps as staging's `migrate` minus the remote block and `config push`.
  4. `deploy` (needs migrate): `VERCEL_PROJECT_ID: vars.VERCEL_PROJECT_ID_PRODUCTION`; `vercel pull --environment=production`
     → `vercel build --prod` → `vercel deploy --prebuilt --prod -e APP_VERSION=<version> -e GIT_SHA=<sha>`.
  5. `smoke` (needs deploy): `node scripts/smoke-health.mjs "$PRODUCTION_URL" "<sha>" production` (existing script).
  6. `release` (needs smoke): `node scripts/changelog.mjs <prevTag> <sha> > notes.md`;
     `gh release create v<version> --target <sha> --notes-file notes.md`.
     Secrets only through `env:`. Repository-level names with `_PRODUCTION` suffix (like ADR-023).
- New `scripts/changelog.mjs` (+ `changelog.test.mjs`): groups commit subjects between two refs by conventional type
  (Features, Fixes, Docs, Other), drops merge commits, links `(#N)`; first release lists everything.
- New `scripts/next-version.mjs` (or a function in `changelog.mjs`): latest `v*` tag → next patch; none → `0.1.0`.
- `scripts/workflows.test.mjs`: deploy-production is `workflow_dispatch` only; job order gate→checks→migrate→deploy
  →smoke→release; actor guard present; no secret in `run:` lines; no other workflow references it.

**Secrets / variables Merna adds** (names only, steps in the PR and tutorial)

| Kind     | Name                                                                                |
| -------- | ----------------------------------------------------------------------------------- |
| Secret   | `SUPABASE_DB_PASSWORD_PRODUCTION`                                                   |
| Variable | `SUPABASE_PROJECT_REF_PRODUCTION`, `VERCEL_PROJECT_ID_PRODUCTION`, `PRODUCTION_URL` |
| Reused   | `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`                            |

Vercel production project env: `APP_ENV=production`, `SIGNUPS_OPEN=false`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (sensitive). Root directory `apps/web`, Node 22, Git **not** connected.

**Docs**

- `docs/DECISIONS.md`: ADR-025 with decisions 1–7 (notes it narrows ADR-021's production rule).
- New `docs/backend/tutorials/release-to-production.md`: one-time setup (projects, secrets, PAT scope rule), run the
  workflow, read the release, rollback (Instant Rollback + "fix forward"), paused project recovery.
  Link from `switch-environment.md`.
- `.claude/commands/release-check.md`: step 4 checks `_PRODUCTION` vars exist; step 5 links the workflow
  ("Actions → Deploy to production → Run workflow, confirm = deploy").
- `docs/SRS.md`: NFR-13 adds production (manual workflow, Merna only, staging-green SHA, sign-ups flag).
- `docs/ARCHITECTURE.md`: feature flag line mentions `SIGNUPS_OPEN` until PostHog.
- `.env.example`: `SIGNUPS_OPEN` note. `postman/environments/production.postman_environment.json` (baseUrl only).
- Test cases `docs/test-cases/infra/20-production-deploy.md` (TC-INF-20-01..06): non-Merna/bad confirm refused;
  unknown/red SHA refused; full run deploys and `/api/health` shows production + SHA; release with changelog created;
  rollback tried once and health shows the previous SHA; production home shows "قريباً". Then `pnpm test-cases:index`.
- Handbook: glossary (instant rollback, fix forward, release tag), Vercel card (2nd project), learning-log row.
- `docs/milestones/` M0 brief row #20 status, CLAUDE.md status.

## Tests

- Unit (`env.test.ts`): `loadFeatureFlags` defaults (production → false, staging/local → true, explicit value wins);
  production without AI keys passes when sign-ups closed, fails when `SIGNUPS_OPEN=true`.
- Web: home page renders "قريباً" and no button when closed, button when open.
- Scripts: changelog grouping/first release/merge commits dropped; next-version cases (`none→0.1.0`, `v0.1.3→0.1.4`).
- Workflow YAML test (above).

## Verification

1. `pnpm quality && pnpm test` green.
2. After merge and Merna's setup: run the workflow as another actor or with `confirm=no` → `gate` fails.
3. Run with defaults → all jobs green; `$PRODUCTION_URL/api/health` = `production` + staging SHA; release `v0.1.0`
   with notes exists; home page shows "قريباً".
4. Supabase prod dashboard: migrations match `supabase/migrations`, no seed data.
5. Instant Rollback once (then redeploy), recorded in TC-INF-20-05. Logs show no secret values.

## Risks

- `-e` on `vercel deploy --prebuilt` not applied at runtime → health shows `version: dev`; smoke gates only env+SHA,
  fallback: set `APP_VERSION` via `vercel env` in the deploy step.
- First release has no previous tag → changelog covers all history (acceptable, tested).
- Hobby Instant Rollback only goes one deployment back → older rollbacks = rerun the workflow with an older SHA
  (DB stays forward).
- Free prod project pausing → clear failure at `migrate`, recovery in the tutorial.
- Size stays M; build:sonnet fits.
