# Plan #19: Staging environment (Vercel previews + staging from `main`, Supabase staging, migrations in CI)

Issue: #19 · plan:opus · build:sonnet · size:M · Milestone: M0 - Foundation & environments · Depends on #18 (merged)

Approved by Merna on 2026-10-08, with two additions: installing the Vercel GitHub integration for previews is OK, and
no paid plan before the beta (ADR-022).

## Context

M0 exit criterion 1: "Staging deployed from `main`". Nothing is deployed by CI yet, no workflow applies migrations to
a remote database, and `/api/health` does not report the git SHA. `switch-environment.md` describes a target that does
not exist (for example `pnpm env:pull` is not a script). The Supabase tech card and ADR-014 say staging needs Supabase
Pro; the issue corrects that (Free is fine until the beta).

## Decisions (one new ADR at build time, next free number)

1. **One Vercel project for staging (Hobby).** Custom environments need Vercel Pro. The existing project `tafsila`
   (team `merna550s-projects`) is the staging project: its "Production" target is staging (`main`), its "Preview"
   target is PR previews. Its stable domain was added by hand in Settings → Domains (value in `STAGING_URL`).
   Real production gets its own project at M8 (ADR-014, ADR-022) — out of scope.
2. **Previews from the Vercel Git integration; `main` deploys from GitHub Actions.** `vercel.json` sets
   `git.deploymentEnabled.main = false`, so `main` runs **migrate → deploy → smoke** in that order (auto-deploying
   `main` from the Git integration would race the migration).
3. **Supabase staging on the Free plan** until the beta; it pauses after 7 idle days and is woken from the dashboard.
   Previews share the staging database with `APP_ENV=preview`. PR migrations are proven by `supabase.yml`
   (`db:reset` on a fresh local stack, #18), never applied to staging before merge.
4. **Migrations only from CI** (`supabase db push`). Migrations stay backward compatible for one release.
5. **Repository-level secrets, not a GitHub environment.** Environment secrets in private repositories need GitHub
   Pro/Team (paid; ADR-022). Staging-only names end in `_STAGING`. The job uses `concurrency: staging` instead of an
   environment lock.
6. **Test OTP on staging** through `supabase/config.toml` `[remotes.staging]` + `supabase config push` in the same
   workflow, reusing the three numbers of ADR-021. Fallback if the hosted project refuses it with the dummy SMS
   provider: Merna sets the same numbers in the dashboard (Authentication → Sign In / Providers → Phone), documented
   in the tutorial.

## Secrets and variables (already added by Merna on 2026-10-08)

GitHub → Settings → Secrets and variables → Actions:

| Kind     | Name                           | Used by                          |
| -------- | ------------------------------ | -------------------------------- |
| Secret   | `SUPABASE_ACCESS_TOKEN`        | `supabase link`, `db push`       |
| Secret   | `SUPABASE_DB_PASSWORD_STAGING` | `supabase db push`               |
| Secret   | `VERCEL_TOKEN`                 | `vercel pull/build/deploy`       |
| Variable | `SUPABASE_PROJECT_REF_STAGING` | `supabase link`, `config push`   |
| Variable | `VERCEL_ORG_ID`                | Vercel CLI (team ID, `team_...`) |
| Variable | `VERCEL_PROJECT_ID_STAGING`    | Vercel CLI (`prj_...`)           |
| Variable | `STAGING_URL`                  | smoke check, no trailing slash   |

Vercel project → Settings → Environment Variables: `APP_ENV` (`staging` for Production, `preview` for Preview),
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (sensitive).

## Changes

**Code**

- `packages/config/src/env.ts`: add `loadBuildInfo(source)` → `{ environment, version, gitSha }`; `gitSha` falls back
  `GIT_SHA` → `VERCEL_GIT_COMMIT_SHA` → `"unknown"`. No required variables, so health never fails on config. Add
  `VERCEL_GIT_COMMIT_SHA` as optional in the schema.
- `packages/api/src/container.ts`: `AppInfo` gets `gitSha`; built with `loadBuildInfo()` (removes the direct
  `process.env` reads noted in `docs/handbook/patterns/composition-root.md`).
- `packages/api/src/routes/health.ts`: response adds `gitSha`.
- `apps/web/src/instrumentation.ts`: `register()` calls `loadServerEnv()` on the Node runtime, so a missing Vercel
  variable fails the smoke check loudly.
- `vercel.json` (location per Vercel monorepo docs): install `pnpm install --frozen-lockfile`, build
  `turbo run build --filter=@tafsila/web`, `git.deploymentEnabled.main: false`. Root directory `apps/web` and
  Node 22 are project settings (documented in the tutorial).

**CI** — new `.github/workflows/staging.yml` (push to `main` + `workflow_dispatch`, `concurrency: staging`, no cancel,
`permissions: contents: read`):

1. `migrate`: `pnpm exec supabase link --project-ref "$SUPABASE_PROJECT_REF_STAGING"` → `supabase db push` →
   `supabase config push` (test OTP).
2. `deploy` (needs migrate): `vercel pull --yes --environment=production` → `vercel build --prod` →
   `vercel deploy --prebuilt --prod`. Vercel CLI pinned as a root devDependency (add it to the Vercel tech card
   `packages:` for `docs:check`).
3. `smoke` (needs deploy): `node scripts/smoke-health.mjs "$STAGING_URL" "$GITHUB_SHA" staging` — retries for about
   2 minutes; fails unless `status=ok`, `environment=staging`, `gitSha=$GITHUB_SHA`.

Secrets only through `env:`; nothing echoed.

**Config / data**

- `supabase/config.toml`: `[remotes.staging]` with `project_id = "env(SUPABASE_PROJECT_REF_STAGING)"` and the same
  test OTP numbers.
- `.env.example`: `GIT_SHA` / `VERCEL_GIT_COMMIT_SHA` note.
- `postman/environments/staging.postman_environment.json`: real staging `baseUrl` (no keys).

**Docs**

- New ADR for the staging setup; it states it supersedes ADR-014's Supabase sentence.
- `docs/handbook/tech/supabase.md`: Free is fine for staging until the beta. `vercel.md`: staging project, Git
  integration for previews, CLI deploys for `main`.
- `docs/backend/tutorials/switch-environment.md`: real URLs, the table above (names only), replace the non-existent
  `pnpm env:pull` with `pnpm exec vercel env pull`, how to wake a paused Supabase project, how to re-run the workflow.
- SRS: NFR-13 "Environments" (preview per PR, staging from `main`, migrations by CI only, free tiers until beta).
- Test cases `docs/test-cases/infra/TC-INF-19-xx`: preview URL works; staging health shows the SHA; migration applied;
  test OTP sign-in on staging; paused project recovery. Then `pnpm test-cases:index`.
- Handbook: glossary (preview deployment, `supabase db push`, repository secret), learning-log row.
- CLAUDE.md status.

## Tests

- Unit: `loadBuildInfo` fallbacks (`GIT_SHA` wins, Vercel SHA used, default `unknown`); health JSON includes `gitSha`
  (`app.test.ts`); `loadServerEnv` accepts `APP_ENV=staging|preview`.
- Script test: smoke script passes on a matching body, fails on wrong environment / wrong SHA / non-200 after
  retries (fake fetch).
- Workflow YAML test like the existing ones (jobs order, no secret in `run:` lines).

## Verification

1. `pnpm quality && pnpm test` green.
2. The PR gets a Vercel preview comment → `/api/health` shows `environment: preview`.
3. Run `staging.yml` with `workflow_dispatch` on the branch → migrate, deploy and smoke green; after merge,
   `$STAGING_URL/api/health` returns `staging` and the merge SHA.
4. Supabase dashboard → migrations match `supabase/migrations`; a test number signs in with `123456`.
5. Workflow logs show no secret values.

## Risks

- `config push` with the dummy SMS provider may be refused → dashboard fallback (documented).
- Free project paused → `migrate` fails with a clear message; the tutorial says how to wake it.
- Previews share the staging database → the seed is never pushed to staging (`db push` without `--include-seed`).
- GitHub Actions minutes: three short jobs per merge, well inside the free quota.
- Size stays M; build:sonnet fits (mostly config and small code).
