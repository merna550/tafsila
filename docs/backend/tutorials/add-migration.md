# Change the database

1. `supabase migration new <name>` → write SQL (tables, indexes, RLS policies). Every user-owned table gets RLS `owner_id = auth.uid()`.
2. `pnpm db:reset` (applies all migrations + seed locally). Add seed rows to `supabase/seed.sql` and document them in `seed-data.md`.
3. `pnpm db:types` regenerates TypeScript types; update the hand-written Drizzle schema in `packages/api/src/adapters/supabase/` to match (compare with `drizzle-kit pull` if unsure; never `drizzle-kit push`). Add RLS policies and grants in the same migration (ADR-035).
4. Tests: RLS test (user A cannot read user B), migration applies on a fresh DB (CI).
5. Deploy: CI applies migrations to staging on merge and to prod on release. Never edit prod schema by hand.
