---
packages: [pg, postgres]
level: intermediate
adr: ADR-003
---

# PostgreSQL

**In one line:** The relational database underneath [Supabase](supabase.md), chosen because credits and pattern versions must change together or not at all.

## What it is (plain words)

Postgres stores data in tables with rules between them (keys, constraints) and answers questions in SQL. Its key feature for us is **transactions**: several changes succeed together or are all undone.

## Why we chose it

- **Atomic money and versions.** Spending a credit and saving a new pattern version, or writing a payment and granting credits, must be one all-or-nothing step. The credits table is an append-only [ledger](../glossary.md#ledger) ([ARCHITECTURE section 5](../../ARCHITECTURE.md)).
- **Relational by nature.** Users own clients, clients own measurements and designs, designs own versions: joins and foreign keys fit better than documents.
- **Row-level security** is a Postgres feature, used for privacy ([supabase](supabase.md)).
- **Portable.** Every managed Postgres host can take our dump.

## Alternatives we considered (and why not)

- **MongoDB:** no multi-document guarantees we want for money, weaker relational queries.
- **SQLite:** great locally, but no row-level security and awkward multi-user hosting.

## When we would change it

Practically never. If read load grew massively, add read replicas or a cache, not a different database.

## Where it lives in our code

- `supabase/migrations/` and `supabase/seed.sql` (empty or minimal until M1).
- Typed access planned through [Drizzle](drizzle.md); generated types at packages/api/src/adapters/supabase/ (planned, `pnpm db:types`).
- Rules: `.claude/rules/backend/database.md`.

## The 20% you need

- Write changes as migration files; never edit a deployed one, add a new one.
- Use `BEGIN ... COMMIT` (or the client's transaction helper) when two writes belong together.
- Money and credit counts are integers (piastres, whole credits), never floats.

## Commands you'll use

`pnpm db:reset`, and `supabase db diff` to draft a migration after changing the local schema.

## Common mistakes

- Forgetting RLS on a new table.
- Storing a computed balance instead of summing the ledger.

## Learn more

- [PostgreSQL docs](https://www.postgresql.org/docs/current/) (official), [Transactions tutorial](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- Glossary: [Postgres](../glossary.md#postgres), [SQL](../glossary.md#sql), [ledger](../glossary.md#ledger)
