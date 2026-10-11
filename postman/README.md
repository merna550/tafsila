# Postman

Ready to run: import, pick an environment, press **Run**. No manual tokens, no manual ids.

## One-time setup

1. Postman → Import → select `postman/tafsila.postman_collection.json` and all files in `postman/environments/`.
2. Local: run `pnpm dev:all` (Supabase local + seed + app). Copy the anon key printed by `supabase start` into the **local** environment (`supabaseAnonKey`) — once.
3. Staging/prod: fill `supabaseUrl` / `supabaseAnonKey` once (prod test password stays only on your machine).

## Running

- Select environment **Tafsila — local** → collection → **Run**. Requests are ordered as a user journey (auth → clients → designs → versions → exports → billing sandbox).
- Login happens automatically (collection pre-request script); created ids are saved to the environment for the next requests.
- Requests named `ERR …` are negative tests and expect an error code.
- CLI: `pnpm api:test` runs the same collection with Newman against a throwaway local API (no Docker, no Supabase; also in CI when the API changes). `pnpm api:test --base-url <url>` runs it against a given API such as staging and uses the real login.

## Keeping it current

The collection is generated from the OpenAPI document `packages/api/openapi.json` (`pnpm api:openapi && pnpm api:postman`). Never edit it by hand: change the route's Zod schema and `.meta({ example })`, or add an `ERR` case to `postman/err-cases.json`, then regenerate. `pnpm api:check` (part of `pnpm quality`, and a CI step when the API changes) fails if either file is out of date. The `debug` route is left out of the collection on purpose.

## Test data

Seed accounts and records: `docs/backend/seed-data.md`.
