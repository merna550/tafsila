# Add an API endpoint

1. **Contract:** add request/response Zod schemas with `.openapi({ example })` in `packages/schemas`. Examples feed Postman and API docs.
2. **Service:** one use case per file in `packages/api/src/services/<action>.ts`, depending only on interfaces in `packages/api/src/ports/`.
3. **Adapter:** DB/storage/payment/AI calls in `packages/api/src/adapters/<vendor>/` (plus a `memory/` fake), wired in `container.ts`; never call Supabase or Paymob from services directly. For a database table, follow the repository pattern below.
4. **Route:** `packages/api/src/routes/<area>.ts` validates with the schema, checks auth, calls the service; mount it in `app.ts`.
5. **Tests:** service unit tests with fake adapters; integration test against local Supabase; permission test (another user's data → 404).
6. **Docs:** `pnpm api:openapi && pnpm api:postman` (regenerates OpenAPI + Postman); add seed rows if needed; add test cases file; update SRS §8 table.
7. **Postman check:** run the collection on local; add an `ERR …` example for the main failure case.

## Repository pattern (ADR-035)

A repository is a port in `ports/` plus an adapter in `adapters/supabase/` that uses Drizzle. Every method takes the caller's `UserContext` and runs inside `withUser`, so Postgres applies the user's RLS policies.

```ts
// ports/client-repository.ts
/** Stores and reads the signed-in user's clients. */
export interface ClientRepository {
  list(ctx: UserContext): Promise<Client[]>;
  create(ctx: UserContext, input: NewClient): Promise<Client>;
}

// adapters/supabase/client-repository.ts
/** Drizzle implementation: every query runs as the user through withUser. */
export function createClientRepository(withUser: WithUser): ClientRepository {
  return {
    list: (ctx) => withUser(ctx, (tx) => tx.select().from(clients)),
    create: (ctx, input) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx
          .insert(clients)
          .values({ ...input, ownerId: ctx.userId })
          .returning();
        return row;
      }),
  };
}
```

Rules:

- `withUser(ctx, fn)` is the only door to the database. It verifies the JWT, opens a transaction, sets `role authenticated` and `request.jwt.claims`, then calls `fn(tx)`. The raw client is never exported.
- A write that touches several tables (credits + version) is one `withUser` call, so it is one transaction.
- Postgres driver option `prepare: false` (the pooler runs in transaction mode).
- The table, RLS policies and grants come from a SQL migration first; the Drizzle schema mirrors it (see `add-migration.md`).
- Tests: service tests use the `memory/` fake; adapter tests run against local Supabase and must cover own rows, another user's rows (nothing returned), an invalid token (rejected) and, for multi-table writes, rollback on failure.
- The decision, numbers and the guard-test idea are in ADR-035.
