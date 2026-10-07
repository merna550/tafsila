---
packages: [drizzle-orm, drizzle-kit]
level: intermediate
adr: ADR-012
---

# Drizzle ORM

**In one line:** A type-safe way to query Postgres from TypeScript without hiding SQL. Planned for M1; not installed yet.

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

When we implement the first repository (M1) we confirm the choice with a spike; if the Supabase generated types plus plain SQL are simpler, we drop Drizzle. The decision is recorded in [ADR-012](../../DECISIONS.md).

## Where it lives in our code

Not installed yet. Planned: repository adapters under packages/api/src/adapters/supabase/, behind ports in `packages/api/src/ports/` (existing example of a port: `packages/api/src/ports/clock.ts`).

## The 20% you need

- Tables are declared in TypeScript; migrations are still SQL files in `supabase/migrations/` (one place for the schema).
- Repositories return domain objects validated by [Zod](zod.md), not raw rows.

## Commands you'll use

Planned: `drizzle-kit` is not used to apply migrations; Supabase migrations stay authoritative.

## Common mistakes

- Letting Drizzle push schema changes directly instead of writing a migration file.
- Importing the Drizzle client in a service.

## Learn more

- [Drizzle docs](https://orm.drizzle.team/docs/overview) (official)
- Glossary: [Drizzle](../glossary.md#drizzle), [ORM](../glossary.md#orm), [repository](../glossary.md#repository)
