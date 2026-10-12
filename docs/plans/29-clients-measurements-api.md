# Plan #29: Clients and measurement sets API (CRUD) with Postman

Issue: #29 · plan:sonnet · build:sonnet · size:M · Milestone: M1 - Accounts & data · FR-MEAS-04

Depends on #24 (merged, ADR-24a), #28 (merged, PR #89), #25 (auth, `requireAuth` exists). #23 decided Drizzle behind `withUser` (ADR-035); ADR-24a moved `DATABASE_URL`, the Drizzle schema mirror and the first repository to this issue.

## Approach

Hexagonal, one use case per file, the pattern from `docs/backend/tutorials/add-endpoint.md`:
routes (`createRoute` + `.openapi`, behind `requireAuth`) -> services -> `ClientRepository` / `MeasurementSetRepository` / `PlanLimits` ports -> Drizzle adapters (only through `withUser`, `prepare: false`) + memory adapters (tests and `pnpm api:test`).
Ownership is enforced twice: RLS in the database (already done in #24) and, in the memory fake, by filtering on the caller. Another user's row is always `404 NOT_FOUND`, never 403.
Measurements are parsed with `measurementsSchema` (shape) and then `validateMeasurements` from `@tafsila/engine` (rules). Errors block the save (422 `MEASUREMENTS_INVALID`); warnings are saved and returned in the response.

## API contract (SRS section 8, `/api/clients`, `/api/measurements`)

All routes need `Authorization: Bearer`. Lists return `{ items, total, limit, offset }`; `limit` 1-100 (default 20), `offset` >= 0; order `created_at desc, id desc`.

| Method and path                 | Purpose                                                     | Success              |
| ------------------------------- | ----------------------------------------------------------- | -------------------- |
| `POST /api/clients`             | create `{ name, notes? }`                                   | 201 client           |
| `GET /api/clients`              | list; `q` = case-insensitive name search, `limit`, `offset` | 200 page             |
| `GET /api/clients/{id}`         | one client                                                  | 200 client           |
| `PATCH /api/clients/{id}`       | change `name` and/or `notes` (at least one field)           | 200 client           |
| `DELETE /api/clients/{id}`      | delete; its measurement sets go with it (FK cascade)        | 204                  |
| `POST /api/measurements`        | save `{ clientId?, label, sizeLabel?, measurements }`       | 201 set + `warnings` |
| `GET /api/measurements`         | list; filter `clientId`, `limit`, `offset`                  | 200 page             |
| `GET /api/measurements/{id}`    | one set (response carries fresh `warnings`)                 | 200 set              |
| `PUT /api/measurements/{id}`    | replace `label`, `sizeLabel`, `measurements` (client fixed) | 200 set + `warnings` |
| `DELETE /api/measurements/{id}` | delete                                                      | 204                  |

Errors (all from the catalogue): 400 `VALIDATION_FAILED` (bad shape, field -> message in `details.fields`), 401 `UNAUTHENTICATED`, 404 `NOT_FOUND` (missing, another user's, or a `clientId` that is not yours), 422 `MEASUREMENTS_INVALID` (new code), 403 `FORBIDDEN` (plan limit, never triggered until M7).
`MEASUREMENTS_INVALID` body: `message_ar` / `message_en` default text, `details.fields` (measurement key -> English message) and `details.issues[]` (`{ code, fields, message_ar, message_en }`, the engine's issue objects, so the UI picks the language). `apiErrorBodySchema` gets the optional `issues` array; `ErrorDetails` gets `issues`.
Client or set row shape: `{ id, name, notes | null, createdAt }` and `{ id, clientId | null, label, sizeLabel | null, measurements, warnings, createdAt }` (ISO strings).

## Files to create or change (the build reads only these and its CONTEXT_MAP row)

Schemas (`packages/schemas/src/`, exported from `index.ts`):

- `pagination.ts` (page query and `pageOf(item)` helper), `clients.ts` (client, create/update input, list query), `measurement-sets.ts` (set, save input, list query, `measurementIssueSchema`), `api-error.ts` (add `details.issues`), each with `.meta({ example })` and tests.

API (`packages/api/src/`):

- `ports/client-repository.ts`, `ports/measurement-set-repository.ts`, `ports/plan-limits.ts` (`canAddClient(ctx, currentCount)`), `ports/user-context.ts` is not needed: use `AuthContext`.
- `domain/errors.ts`: add `MEASUREMENTS_INVALID` (422) and `issues` in `ErrorDetails`; `domain/measurements-check.ts`: runs `validateMeasurements`, throws on errors, returns warnings (no I/O).
- `services/`: `create-client.ts`, `list-clients.ts`, `get-client.ts`, `update-client.ts`, `delete-client.ts`, `save-measurement-set.ts`, `list-measurement-sets.ts`, `get-measurement-set.ts`, `update-measurement-set.ts`, `delete-measurement-set.ts`, each with a `.test.ts`.
- `adapters/supabase/`: `db/schema.ts` (Drizzle mirror of `clients` and `measurement_sets`, compared with `pnpm db:types` output), `db/with-user.ts` (only export; transaction, `set local role authenticated`, `request.jwt.claims` from the verified `AuthContext`, rejects a context without `sub`), `client-repository.ts`, `measurement-set-repository.ts` (search `ilike` with `%` and `_` escaped; Postgres error 23503 -> `NotFoundError("client")`).
- `adapters/memory/`: `client-repository.ts`, `measurement-set-repository.ts` (owner-filtered, same ordering, cascade on client delete), `adapters/plan/unlimited-plan-limits.ts`.
- `container.ts`: add the three ports; Drizzle repositories when `DATABASE_URL` is set, otherwise rejecting repositories (INTERNAL_ERROR, like the rejecting token verifier) so production can never fall back to memory silently.
- `routes/clients.ts`, `routes/measurements.ts` (+ route tests), mounted in `app.ts`.
- `dev/test-server.ts`: pass memory repositories so `pnpm api:test` still needs no Docker.
- `package.json`: add `@tafsila/engine`, `drizzle-orm`, `postgres`; script `test:db` for `*.db.test.ts` (adapter tests against local Supabase, excluded from the default `test`).
- `packages/config/src/env.ts` (+ test): optional `DATABASE_URL` in the server env; `.env.example`; `.env.docker.example` and `.github/ci.env` change the user to `api_app` (they currently use `postgres`, which bypasses RLS).
- `.dependency-cruiser.cjs`: add `drizzle-orm|postgres` to `services-use-ports-not-adapters`, and a rule that only `adapters/supabase/` imports them (ADR-035 follow-up).
- `.github/workflows/supabase.yml`: run `pnpm --filter @tafsila/api test:db` after `db:reset`.
- `packages/api/openapi.json` and `postman/tafsila.postman_collection.json` regenerated (`pnpm api:openapi && pnpm api:postman`); `postman/err-cases.json` gets ERR cases: `POST /api/measurements` with `highBust > bust` -> 422 `MEASUREMENTS_INVALID`; `GET /api/clients/{random uuid}` -> 404; `GET /api/clients` without token -> 401.

## Data / schema changes

No migration: tables, RLS, composite FK and the `api_app` role exist (#24). Seed already has clients and measurement sets for `trial@` and `pro@`; the build checks that `seed.sql` rows pass `validateMeasurements` (the real-body sets) and fixes the seed if not. Postman against a real local login uses `trial@tafsila.test`.

## Test plan

Unit (Vitest, memory adapters):

- `create-client`: name trimmed, empty name -> VALIDATION_FAILED; `PlanLimits` fake that denies -> FORBIDDEN, unlimited adapter always allows.
- `list-clients`: seed 25 clients, `limit 10 offset 20` returns 5 and `total 25`; `q: "ام"` matches by name only, case-insensitive; `q: "%"` matches nothing unless a name contains `%`.
- `save-measurement-set`: a valid set -> saved, `warnings: []`; waist >= hip -> saved with warning code from #28; `highBust 1000, bust 900` -> `MEASUREMENTS_INVALID` with `message_ar` and `message_en` on every issue, nothing stored; `bust 49` (below range) -> rejected; `clientId` of another user -> NOT_FOUND.
- `update-measurement-set` re-validates; `delete-client` removes its sets in the memory fake.
- Permission matrix (route level, two tokens A and B): B calls GET, PATCH, DELETE on A's client and set -> 404; B lists -> A's rows absent; B saves a set with A's `clientId` -> 404; no token -> 401.
- Error contract: every new response has `{ code, message_ar, message_en, request_id }`; `errors.test.ts` green with the new code and its `docs/errors.md` row.

Property (fast-check):

- Paging: for any list of clients and any `limit`/`offset`, concatenating pages gives the full list in order, no duplicates.
- Every size of the placeholder chart (`fromStandardSize`) saves with no errors.
- A valid set with overrides that stay in range never returns errors.

Adapter / integration against local Supabase (`*.db.test.ts`, CI supabase job): own rows, another user's rows (nothing returned, update and delete touch 0 rows), forged `owner_id` in the input is ignored (owner always the caller), a `clientId` of another user is rejected by the FK, invalid claims rejected, raw connection without `withUser` gets `permission denied`, client delete cascades to sets, search with `%` and `_` is literal.

OpenAPI and Postman: `document.test.ts` lists the ten new operations and the `MEASUREMENTS_INVALID` schema; `pnpm api:check` fresh; `pnpm api:test` green (create client, list with `q`, update, save invalid -> ERR 422, save valid, delete).

E2E and visual snapshots: none (no UI in this issue; the screens come in #30 and #31).

Draft manual test cases (`docs/test-cases/api/29a-clients-measurements-api.md`):

- TC-API-29-01 create, read, update, delete a client with Postman against local (seed user `trial@`)
- TC-API-29-02 list clients with paging and name search (`pro@` has 5)
- TC-API-29-03 user B cannot read, change or delete user A's client (404)
- TC-API-29-04 save valid measurements -> 201
- TC-API-29-05 save measurements with `highBust > bust` -> 422 with Arabic and English text
- TC-API-29-06 save measurements with `waist >= hip` -> 201 with a warning
- TC-API-29-07 a set cannot point at another user's client (404)
- TC-API-29-08 deleting a client deletes its sets
- TC-API-29-09 `pnpm api:test` green, and red when a route breaks
- TC-API-29-10 no token -> 401 on every route

## Docs to update

SRS section 8 table and FR-MEAS-04 note (limit/offset, the ten routes), `docs/errors.md` (`MEASUREMENTS_INVALID` row), `docs/DECISIONS.md` index row, `docs/decisions/29a-clients-measurements-api.md`, `docs/backend/tutorials/add-endpoint.md` and `.claude/skills/add-endpoint/SKILL.md` (real example links, `withUser` takes the already verified `AuthContext`, the rejecting-adapter fallback), `docs/backend/README.md` env table (`DATABASE_URL` with `api_app`), `docs/backend/seed-data.md` (only if the seed changes), `docs/milestones/M1-accounts-and-data.md` (follow-up done), `postman/README.md`, test cases file + `scripts/test-case-index.sh`, `docs/handbook` learning log row, CLAUDE.md "Current status".

## Decisions (the build writes them as `docs/decisions/29a-clients-measurements-api.md`)

1. Paging is `limit` + `offset` with `total` (small lists, cheap to change to cursors later).
2. `MEASUREMENTS_INVALID` is a new 422 code, separate from `VALIDATION_FAILED` (shape errors), with `details.issues` carrying both languages; `details.fields` carries the English text, like the Zod errors.
3. Warnings are computed on every read and write and are not stored (the rules may change; stored warnings would go stale).
4. `withUser` reuses the claims verified by `requireAuth` (one verification per request, as noted in `token-verifier.ts`); it only refuses a context without `sub`.
5. Missing `DATABASE_URL` wires rejecting repositories, never memory ones.
6. `PlanLimits` exposes `canAddClient` only (YAGNI); M7 adds more methods.
7. The API connects as `api_app` everywhere (local, CI, staging); the `postgres` URL in `ci.env` is replaced.
8. No standard-size/override endpoint: the client sends full `measurements` (use `fromStandardSize` in the UI/engine); `sizeLabel` is only stored as a label.

## Risks

- Connecting as the `postgres` superuser would bypass RLS: `ci.env` / docker env are switched to `api_app`, and an adapter test proves a raw connection reads nothing.
- Local pooler is disabled in `supabase/config.toml`; the build uses the direct port 54322 with `prepare: false` (works for both). Staging password for `api_app` must exist before the staging deploy; if it is missing the build adds `needs:decision` rather than guessing.
- Node is slightly below the engines floor in cloud sessions: run checks with `npm_config_engine_strict=false`.
- Drizzle schema can drift from SQL: a test compares the column names with `database.types.ts`.
- Adding `drizzle-orm` and `postgres` grows the function bundle (~137 kB measured in #23): accepted by ADR-035.

## Size and labels

size:M is right (about 25 new files, no migration, no UI). plan:sonnet and build:sonnet stay: the pattern is decided and documented, nothing needs Opus.
`node scripts/needs-interactive.mjs` on the files above answers `no`.
Status after planning: `status:ready` (plan:sonnet, size M).

## Needed from Merna (before staging deploy, not before the build)

Set the staging password of the `api_app` database role once (ADR-24a: never in a migration) and add the staging `DATABASE_URL` secret in the form `postgresql://api_app:<password>@<host>:5432/postgres`. Without it the build and CI still pass (local and CI use the local password), but the API on staging cannot reach the database.
