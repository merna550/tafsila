# packages/api — agent notes

Hono API, hexagonal (ports and adapters). Root rules in `/CLAUDE.md` still apply; this file adds only what is specific to the backend.
Full guide: `docs/backend/README.md` · Architecture: `docs/ARCHITECTURE.md` §2 · Tutorials: `docs/backend/tutorials/`.

## Layers

```
routes/      HTTP adapter: validate (Zod) → call service → map result
middleware/  auth, request-id + logging, rate limit, error mapper
services/    one use case per file, named as an action (create-pattern-version.ts)
domain/      entities, business rules, domain errors; no I/O
ports/       interfaces services need (DesignRepository, PaymentGateway, AIProvider, Clock…)
adapters/    implementations: supabase/, paymob/, anthropic/, memory/ (test fakes), system/
container.ts composition root: wires ports → adapters per environment
```

- Dependencies point inward: `routes → services → domain`. Services import `ports`, never `adapters` (dependency-cruiser enforces).
- Vendor swap = new adapter + one line in `container.ts`.
- New endpoint: use the `add-endpoint` skill.

## Contracts and errors

- Request/response schemas live in `packages/schemas` with `.openapi({ example })`. Never redeclare a type here.
- Throw only domain errors from `src/domain/errors.ts`; `middleware/error-handler.ts` maps them to HTTP.
- Error body is always `{ code, message_ar, message_en, details? }`.

## Data rules

- Only `adapters/supabase/` writes queries. RLS on every user-owned table.
- Credit consumption + version creation in one transaction.
- Payment webhooks idempotent by `paymob_order_id`; verify HMAC first.
- Time and IDs come from the `Clock` / `IdGenerator` ports, never `Date.now()` in services.

## After any route or schema change

1. `pnpm api:openapi && pnpm api:postman`
2. `pnpm api:test` green on local
3. Seed data + `docs/backend/seed-data.md` if new records are needed
4. Matching tutorial in `docs/backend/tutorials/` updated

## Tests

- Services with `memory/` adapters (fast, offline).
- Adapters against local Supabase or the payment sandbox.
- Every route: an integration test plus a permission test (another user's data → 404).
