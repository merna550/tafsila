# Backend documentation

Kept current in the same PR as every backend change (Definition of Done).

| Doc               | What it answers                                                                     |
| ----------------- | ----------------------------------------------------------------------------------- |
| `architecture.md` | Layers (engine → services → adapters), request flow, where code goes                |
| `api-reference`   | Generated from OpenAPI at `/api/docs` (Scalar UI) — every endpoint, schema, example |
| `seed-data.md`    | Test accounts and records created in every non-prod environment                     |
| `ci-minutes.md`   | What costs GitHub Actions minutes, how to read the Usage page, rules of thumb       |
| `environments.md` | dev / preview / staging / prod: URLs, data, keys, how to switch                     |
| `tutorials/`      | Step-by-step how-tos (below)                                                        |
| `../plans/`       | One file per issue: the approved plan (copied from the issue comment)               |
| `../test-cases/`  | Manual test scenarios per feature                                                   |
| `../../postman/`  | Ready-to-run Postman collection + environments                                      |

## Tutorials

| Tutorial                           | When                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `tutorials/run-locally.md`         | First time on a machine; daily start                                                  |
| `tutorials/add-endpoint.md`        | New API route (schema → service → adapter → tests → OpenAPI → Postman)                |
| `tutorials/add-migration.md`       | Any DB change (migration, RLS, seed update, types regen)                              |
| `tutorials/use-postman.md`         | Testing the API by hand                                                               |
| `tutorials/run-agents-in-cloud.md` | Let agents build issues while the laptop is off (setup, start, stop, pause, tokens)   |
| `tutorials/switch-environment.md`  | Pointing the app/tools at dev, staging or prod                                        |
| `tutorials/delete-account.md`      | What account deletion removes, where, how to check it, the admin SQL, the PostHog key |
| `tutorials/docker.md`              | Images, containers, compose profiles, prod-like local run                             |
| `tutorials/add-garment-module.md`  | New pattern feature in the engine (geometry, validation, tests, sew test)             |

## Authentication (plan #25, part B)

Sign-up, sign-in and reset go from the browser straight to Supabase Auth; our API never sees a password. Protected routes use `requireAuth(container.tokenVerifier)` from `packages/api/src/middleware/auth.ts`: it verifies the bearer access token once (`jose` against the project JWKS, issuer `<SUPABASE_URL>/auth/v1`, audience `authenticated`) and sets `{ userId, role, claims }`. The role is the `user_role` claim added by `public.custom_access_token_hook` (migration `20261011130000`, enabled in `supabase/config.toml`; staging and production need the same `[auth.hook.custom_access_token]` block pushed). `GET /api/me` returns `{ userId, role }`. If `SUPABASE_URL` is missing every token is rejected. Details: [decision 25a](../decisions/25a-auth.md), [Protect a route](tutorials/add-endpoint.md#protect-a-route-plan-25-part-b).

## Phone verification (plan #26, part A)

`GET /api/phone`, `POST /api/phone/code`, `POST /api/phone/verify` (all behind `requireAuth`). The API normalises the number, checks the environment guard (`PHONE_TEST_NUMBERS` outside production), the rate limits and uniqueness, and only then asks the `PhoneOtp` port (Supabase Auth phone change) to send. Phones and IPs are stored only as HMAC hashes (`PHONE_HASH_SECRET`). The database writes go through `withApiRole` (a transaction as the `api_app` role) calling `private.*` functions; this is the only exception to "the only door is `withUser`". Details: [ADR-26a](../decisions/26a-phone-otp-trial.md), [tutorial](tutorials/phone-otp.md).

## Designs (plan #242)

`POST/GET /api/designs`, `GET/PATCH/DELETE /api/designs/:id` (all behind `requireAuth`, rows through `withUser`, RLS is the guard). An untitled design is named by `domain/design-title.ts` (category word in the profile language + Cairo date). The list summary (version count, current status, client name) is one query; `GET /:id` returns the current version's stored inputs only. Versions are written by #245. Details: [ADR-242](../decisions/242-designs-api.md).

**Pattern versions** (`routes/pattern-versions.ts`): `POST/GET /api/designs/:id/versions`, `GET /api/versions/:id`, `POST /api/versions/:id/restore`. The server re-runs the engine (`domain/run-pattern.ts`), stores only `pass`/`warn` results, appends in one `withUser` transaction with the design row locked, and restores by appending a copy (history is append-only). Details: [ADR-245](../decisions/245-pattern-versions-api.md).

## Environment: DATABASE_URL

The API reads and writes through Drizzle on `DATABASE_URL` (optional in `packages/config/src/env.ts`; without it the repositories reject every call). Use the `api_app` login role, never `postgres` (the superuser bypasses RLS). Local: `postgresql://api_app:api_app_local_only@127.0.0.1:54322/postgres` (password in `supabase/roles.sql`). Staging: set the `api_app` password once and add the secret (ADR-24a, ADR-29a).
