# Switch environment (dev → staging → prod)

| What     | dev                   | staging                                                    | prod (from M8)                           |
| -------- | --------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| App      | `pnpm dev`            | merge to `main` (workflow `Staging`), `$STAGING_URL`       | its own Vercel project, manual deploy    |
| Previews | -                     | every PR gets a Vercel preview URL (`APP_ENV=preview`)     | -                                        |
| Env vars | `.env.local`          | Vercel project variables (Production / Preview targets)    | Vercel production project                |
| DB       | Supabase local        | Supabase staging project (Free until the beta, ADR-023)    | Supabase prod project                    |
| Postman  | env "Tafsila — local" | "Tafsila — staging" (`https://tafsila-staging.vercel.app`) | "Tafsila — prod" (read-only smoke tests) |

- All variables are declared once in `packages/config/src/env.ts` (Zod) and listed in `.env.example`; the app refuses to start if one is missing (`apps/web/src/instrumentation.ts`).
- Point local tools at staging: `pnpm exec vercel env pull .env.staging.local --environment=production` (needs `vercel login` and `vercel link` once), then run with that file.
- Feature flags (PostHog) turn features on per environment without a deploy.
- Rollback: Vercel → previous deployment → "Promote"; DB migrations are written to be backward compatible for one release.

## How staging is deployed

`.github/workflows/staging.yml` runs on every push to `main` (and by hand: Actions → Staging → Run workflow), in this order:

1. **migrate:** `supabase link`, `supabase db push` (migrations only, never the seed), `supabase config push` (the workflow first appends a `[remotes.staging]` block with the test OTP numbers to `supabase/config.toml`; it is not committed). Before the push it also removes the `[auth.email.template.*]` tables, because Supabase Free refuses custom email templates; staging sends Supabase's default emails ([ADR-107](../../decisions/107-staging-email-templates.md)).
2. **deploy:** `vercel pull`, `vercel build --prod`, `vercel deploy --prebuilt --prod` to the staging project.
3. **smoke:** `scripts/smoke-health.mjs` retries `GET $STAGING_URL/api/health` for about 2 minutes and fails unless it reports `status: ok`, `environment: staging` and the merged commit in `gitSha`.

Vercel's own Git deploy of `main` is turned off in `vercel.json`, so the database is always migrated first. Pull requests still get previews from the Vercel Git integration. Migrations reach staging only from this workflow; PR migrations are proven earlier by `supabase.yml`.

## Where each secret lives (names only)

GitHub → Settings → Secrets and variables → Actions (repository level, ADR-022):

| Kind     | Name                           | Used by                           |
| -------- | ------------------------------ | --------------------------------- |
| Secret   | `SUPABASE_ACCESS_TOKEN`        | `supabase link`, `db push`        |
| Secret   | `SUPABASE_DB_PASSWORD_STAGING` | `supabase db push`                |
| Secret   | `VERCEL_TOKEN`                 | `vercel pull/build/deploy`        |
| Variable | `SUPABASE_PROJECT_REF_STAGING` | `supabase link`, `config push`    |
| Variable | `VERCEL_ORG_ID`                | Vercel CLI (team ID, `team_...`)  |
| Variable | `VERCEL_PROJECT_ID_STAGING`    | Vercel CLI (`prj_...`)            |
| Variable | `STAGING_URL`                  | smoke check, no trailing slash    |
| Secret   | `SENTRY_AUTH_TOKEN`            | source map upload (staging build) |
| Variable | `SENTRY_ORG`                   | source map upload                 |
| Variable | `SENTRY_PROJECT`               | source map upload                 |

Vercel project → Settings → Environment Variables: `APP_ENV` (`staging` for Production, `preview` for Preview), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (sensitive), `SENTRY_DSN`, `POSTHOG_KEY`, `POSTHOG_HOST` (`https://us.i.posthog.com`; the DSN and project key are public by design). `SENTRY_AUTH_TOKEN` is never added to Vercel. Project settings: Root Directory `apps/web`, Node.js 22.x, domain added in Settings → Domains.

## Troubleshooting

- **Free Supabase project paused** (7 idle days): the `migrate` job fails on `supabase link`. Open the Supabase dashboard, press "Restore project", wait a few minutes, then re-run the workflow.
- **`supabase config push` refused** (dummy SMS provider): set the same numbers by hand in the dashboard (Authentication → Sign In / Providers → Phone → test numbers): `201000000001`, `201000000002`, `201000000003`, code `123456`.
- **Smoke check fails on `gitSha`:** the deploy served an older build; check the Vercel deployment list and re-run the workflow.
- **Health returns 500:** a Vercel variable is missing; `instrumentation.ts` names the invalid keys in the runtime log.
