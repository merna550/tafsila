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

| Tutorial                           | When                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `tutorials/run-locally.md`         | First time on a machine; daily start                                                |
| `tutorials/add-endpoint.md`        | New API route (schema → service → adapter → tests → OpenAPI → Postman)              |
| `tutorials/add-migration.md`       | Any DB change (migration, RLS, seed update, types regen)                            |
| `tutorials/use-postman.md`         | Testing the API by hand                                                             |
| `tutorials/run-agents-in-cloud.md` | Let agents build issues while the laptop is off (setup, start, stop, pause, tokens) |
| `tutorials/switch-environment.md`  | Pointing the app/tools at dev, staging or prod                                      |
| `tutorials/docker.md`              | Images, containers, compose profiles, prod-like local run                           |
| `tutorials/add-garment-module.md`  | New pattern feature in the engine (geometry, validation, tests, sew test)           |

## Authentication (plan #25, part B)

Sign-up, sign-in and reset go from the browser straight to Supabase Auth; our API never sees a password. Protected routes use `requireAuth(container.tokenVerifier)` from `packages/api/src/middleware/auth.ts`: it verifies the bearer access token once (`jose` against the project JWKS, issuer `<SUPABASE_URL>/auth/v1`, audience `authenticated`) and sets `{ userId, role, claims }`. The role is the `user_role` claim added by `public.custom_access_token_hook` (migration `20261011130000`, enabled in `supabase/config.toml`; staging and production need the same `[auth.hook.custom_access_token]` block pushed). `GET /api/me` returns `{ userId, role }`. If `SUPABASE_URL` is missing every token is rejected. Details: [decision 25a](../decisions/25a-auth.md), [Protect a route](tutorials/add-endpoint.md#protect-a-route-plan-25-part-b).
