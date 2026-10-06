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
- CLI: `pnpm api:test` (Newman, same collection, used in CI against preview/staging).

## Keeping it current

The collection is generated from the OpenAPI spec (`pnpm api:postman`). Never edit it by hand: change the route's Zod schema/examples instead. CI fails if the committed collection is out of date.

## Test data

Seed accounts and records: `docs/backend/seed-data.md`.
