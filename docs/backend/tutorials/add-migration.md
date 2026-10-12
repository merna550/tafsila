# Change the database

1. `supabase migration new <name>` → write SQL (tables, indexes, RLS policies). Every user-owned table gets RLS `owner_id = auth.uid()`.
2. `pnpm db:reset` (applies all migrations + seed locally). Add seed rows to `supabase/seed.sql` and document them in `seed-data.md`.
3. `pnpm db:types` regenerates TypeScript types; update the hand-written Drizzle schema in `packages/api/src/adapters/supabase/` to match (compare with `drizzle-kit pull` if unsure; never `drizzle-kit push`). Add RLS policies and grants in the same migration (ADR-035).
4. Tests: RLS test (user A cannot read user B), migration applies on a fresh DB (CI).
5. Privileged writes (a column users must not change) live in a `security definer` function in the `private` schema (not exposed by PostgREST): `set search_path = ''`, `revoke all … from public, anon, authenticated`, `grant execute … to api_app, service_role`; the API calls it through `withApiRole` (example: `private.confirm_phone`, issue #26). Tables nobody should read directly get RLS with no policies and no grants.
6. Deploy: CI applies migrations to staging on merge and to prod on release. Never edit prod schema by hand.
