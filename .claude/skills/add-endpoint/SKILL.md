---
name: add-endpoint
description: Add a new API endpoint to packages/api (schema → service → port/adapter → route → tests → OpenAPI/Postman → seed → tutorial). Use when an issue needs a new HTTP route or a new backend use case.
---

# Add an API endpoint

Read `packages/api/CLAUDE.md`, `docs/backend/tutorials/add-endpoint.md` and the rules in `.claude/rules/backend/` (rules v2: `layering.md`, `errors.md`, `api-design.md`, `database.md`) first.

1. **Schema:** add request and response Zod schemas with `.openapi({ example })` in `packages/schemas`.
2. **Domain:** put new business rules in `packages/api/src/domain/`. They do no I/O. Every new error code goes into `ERROR_CATALOGUE` (`domain/errors.ts`, Arabic and English message) and as a row in `docs/errors.md` in the same PR (ADR-030); routes and services throw `AppError`, they never build an error body.
3. **Service:** create one use case per file in `packages/api/src/services/<action>.ts`. It depends only on interfaces in `ports/`.
4. **Port and adapter:**
   - If a new external capability is needed, add the interface in `ports/`.
   - Implement it in `adapters/<vendor>/`, plus a fake in `adapters/memory/`.
   - Wire both in `container.ts`.
   - For a database table, follow the repository pattern in `docs/backend/tutorials/add-endpoint.md` (ADR-035): Drizzle only through `withUser`, `prepare: false`, one `withUser` call per atomic write. Services see a repository port, never Drizzle.
5. **Route:** add it in `packages/api/src/routes/` (routes → services → ports/adapters; no layer skipping). It validates with the schema, checks auth and ownership, calls the service, and maps the result. Mount it in `app.ts`.
6. **Tests:**
   - Service unit tests with `memory/` adapters.
   - A route integration test.
   - A permission test: another user's data returns 404.
   - An error test per new code: the body is `{ code, message_ar, message_en, request_id }` and `errors.test.ts` stays green.
   - Adapter tests against local Supabase or the sandbox.
7. **API docs:** declare the route with `createRoute(...)` and `.openapi(route, handler)` on an `OpenAPIHono` (see `routes/me.ts`); document errors with `errorResponses(...)`. Run `pnpm api:openapi && pnpm api:postman`, then `pnpm api:test` (local, no Docker). Add an `ERR …` case for the main failure to `postman/err-cases.json`. `pnpm api:check` fails when the generated files are stale.
8. **Data:** if a migration is needed, follow `docs/backend/tutorials/add-migration.md`. Add seed rows and update `docs/backend/seed-data.md`.
9. **Docs:**
   - Update the SRS §8 API table.
   - Update `docs/backend/tutorials/add-endpoint.md` if the steps changed.
   - Add the new error codes to `docs/errors.md`.
   - If a web screen consumes it, the page work follows the `add-page` skill (typed client in `shared/api`).
   - Add test cases at `docs/test-cases/api/<N>-<slug>.md`, then run `scripts/test-case-index.sh`.
10. **Definition of Done:** complete every item in `docs/WORKFLOW.md` §5. Run `pnpm quality && pnpm test`.

Worked example: issue #29 (`routes/clients.ts`, `services/create-client.ts`, `adapters/supabase/client-repository.ts`); see the "Worked example" section of `docs/backend/tutorials/add-endpoint.md`. `withUser` takes the already verified `AuthContext`; a missing `DATABASE_URL` wires rejecting repositories.
