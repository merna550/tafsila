---
packages: ["@supabase/supabase-js", "@supabase/ssr", supabase]
level: beginner
adr: ADR-003
---

# Supabase

**In one line:** Our hosted Postgres database plus login (phone OTP), file storage and row-level security in one service. Planned for M1; local setup arrives with it.

## What it is (plain words)

Supabase bundles open-source pieces behind one dashboard: a [Postgres](postgres.md) database, an Auth service (email, phone), file Storage with signed URLs, and a way to protect each table row with policies (RLS). A command-line tool runs the whole thing locally in Docker.

## Why we chose it

- **Everything an accounts-and-files product needs in one vendor with a free tier.** Users, client profiles, measurements, pattern versions, uploaded garment photos, and a credits ledger ([ARCHITECTURE section 5](../../ARCHITECTURE.md)).
- **Phone OTP login** matches how Egyptian users sign up (SRS section 4.1, M1).
- **Runs locally in Docker** (`supabase start`, `pnpm db:reset`), so development uses real Postgres and seed data instead of mocks.
- **It is standard Postgres,** so leaving is a migration, not a rewrite. Services never import Supabase directly; they use ports, adapters live in `packages/api/src/adapters/` ([ADR-003](../../DECISIONS.md), [ADR-006](../../DECISIONS.md)).
- **RLS enforces privacy at the database,** which protects client measurements even if an API route has a bug (Egypt's PDPL, [glossary](../glossary.md#pdpl)).

## Alternatives we considered (and why not)

- **Firebase:** NoSQL and strong lock-in; our data is relational.
- **Neon + Clerk + S3:** three vendors to wire and pay alone.
- **Self-hosted Postgres:** operations burden (backups, upgrades, security) for a solo founder.

## When we would change it

Checked on 2026-10-07 at [supabase.com/pricing](https://supabase.com/pricing): the Free plan has 500 MB database, 1 GB storage, 50,000 monthly active users, **pauses projects after one week of inactivity** and allows 2 active projects; Pro starts at $25 per month with 8 GB disk. Free is fine for dev, preview and **staging until the beta** ([ADR-023](../../DECISIONS.md), [ADR-022](../../DECISIONS.md)); **production needs Pro** (no pausing, daily backups). A paused staging project is woken from the dashboard. Revisit if costs or limits no longer fit; move by exporting Postgres and swapping Auth and Storage adapters.

## Where it lives in our code

- `supabase/migrations/` (empty until M1), `supabase/seed.sql`.
- `packages/config/src/env.ts` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Rules: `.claude/rules/backend/database.md`; how-to: `docs/backend/tutorials/add-migration.md`.

## The 20% you need

- Anon key is public and safe in the browser only because **RLS** is on; the service-role key bypasses RLS and never leaves the server.
- Every user-owned table has RLS and a policy per action.
- Schema changes are SQL files in `supabase/migrations/`, applied by CI.

```ts
// packages/config/src/env.ts
SUPABASE_URL: z.url(),
SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
```

## Commands you'll use

```bash
supabase start      # local stack in Docker
pnpm db:reset       # recreate the local database from migrations + seed
pnpm db:types       # regenerate TypeScript types
```

## Common mistakes

- Creating a table without enabling RLS.
- Using the service-role key in browser code.
- Editing the dashboard schema instead of a migration file.

## Learn more

- [Supabase docs](https://supabase.com/docs) (official), [Row Level Security guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Glossary: [Supabase](../glossary.md#supabase), [RLS](../glossary.md#rls), [migration](../glossary.md#migration), [seed](../glossary.md#seed), [storage](../glossary.md#storage), [OTP](../glossary.md#otp)
