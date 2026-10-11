---
packages: [drizzle-orm, drizzle-kit]
level: intermediate
adr: ADR-012
---

# Drizzle ORM

**In one line:** A type-safe way to query Postgres from TypeScript without hiding SQL. Confirmed in M1 by a spike (ADR-032); installed with the first repository (#24).

## What it is (plain words)

An ORM maps tables to code. Drizzle lets you declare tables in TypeScript and write queries that look like SQL but are checked by the compiler, so a misspelled column fails typecheck.

## Why we chose it

- **Types from the schema,** which suits our strictly typed stack ([typescript](typescript.md)).
- **Close to SQL,** so what the agents write is what Postgres runs; no hidden query magic, easy to review.
- **Lightweight,** with no heavy runtime or code generator step, and compatible with [Supabase](supabase.md) Postgres.
- **Contained in adapters.** Services never import Drizzle; repository adapters do ([hexagonal](../patterns/hexagonal-ports-adapters.md)).

## Alternatives we considered (and why not)

- **Prisma:** heavier client and generation step; less natural with RLS and raw SQL.
- **Supabase client only (PostgREST):** fine for simple reads but weak for the transactions our ledger needs.
- **Raw SQL strings:** no type checking.

## When we would change it

The #23 spike compared Drizzle with `supabase-js` on a real local table with RLS. Drizzle stays because it passed the same RLS suite through `withUser`, added about 137 kB to the bundle (limit 300 kB), and does multi-table transactions natively. We would revisit it if the bundle grows past the limit or `withUser` cannot keep up with a Supabase auth change. See [ADR-032](../../DECISIONS.md).

## Where it lives in our code

Not installed yet (arrives with #24). Repository adapters go under packages/api/src/adapters/supabase/, reached only through `withUser`, behind ports in `packages/api/src/ports/` (existing example of a port: `packages/api/src/ports/clock.ts`).

## The 20% you need

- Tables are declared in TypeScript; migrations are still SQL files in `supabase/migrations/` (one place for the schema).
- Repositories return domain objects validated by [Zod](zod.md), not raw rows.
- The database client is never exported. `withUser` verifies the user's token, then runs the query as the `authenticated` role so [RLS](../glossary.md#rls-row-level-security) applies; the driver uses `prepare: false` because the pooler is in transaction mode.

## Commands you'll use

`drizzle-kit pull` can compare the live schema with ours; it is never used to apply migrations (`push` is forbidden). Supabase migrations stay authoritative.

## Common mistakes

- Letting Drizzle push schema changes directly instead of writing a migration file.
- Importing the Drizzle client in a service.

## Learn more

- [Drizzle docs](https://orm.drizzle.team/docs/overview) (official)
- Glossary: [Drizzle](../glossary.md#drizzle), [ORM](../glossary.md#orm), [repository](../glossary.md#repository)
