---
name: add-endpoint
description: Add a new API endpoint to packages/api (schema → service → port/adapter → route → tests → OpenAPI/Postman → seed → tutorial). Use when an issue needs a new HTTP route or a new backend use case.
---

# Add an API endpoint

Read `packages/api/CLAUDE.md` and `docs/backend/tutorials/add-endpoint.md` first.

1. **Schema:** add request and response Zod schemas with `.openapi({ example })` in `packages/schemas`.
2. **Domain:** put new business rules and errors in `packages/api/src/domain/`. They do no I/O.
3. **Service:** create one use case per file in `packages/api/src/services/<action>.ts`. It depends only on interfaces in `ports/`.
4. **Port and adapter:**
   - If a new external capability is needed, add the interface in `ports/`.
   - Implement it in `adapters/<vendor>/`, plus a fake in `adapters/memory/`.
   - Wire both in `container.ts`.
   - For a database table, follow the repository pattern in `docs/backend/tutorials/add-endpoint.md` (ADR-035): Drizzle only through `withUser`, `prepare: false`, one `withUser` call per atomic write.
5. **Route:** add it in `packages/api/src/routes/`. It validates with the schema, checks auth and ownership, calls the service, and maps the result. Mount it in `app.ts`.
6. **Tests:**
   - Service unit tests with `memory/` adapters.
   - A route integration test.
   - A permission test: another user's data returns 404.
   - Adapter tests against local Supabase or the sandbox.
7. **API docs:** run `pnpm api:openapi && pnpm api:postman`, then `pnpm api:test` against local. Add an `ERR …` example for the main failure.
8. **Data:** if a migration is needed, follow `docs/backend/tutorials/add-migration.md`. Add seed rows and update `docs/backend/seed-data.md`.
9. **Docs:**
   - Update the SRS §8 API table.
   - Update `docs/backend/tutorials/add-endpoint.md` if the steps changed.
   - Add test cases at `docs/test-cases/api/<N>-<slug>.md`, then run `scripts/test-case-index.sh`.
10. **Definition of Done:** complete every item in `docs/WORKFLOW.md` §5. Run `pnpm quality && pnpm test`.
