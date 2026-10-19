# Plan #242 · Designs endpoints (create, list, read, rename, delete)

Plan wave M3, 2026-10-19. Depends on #237 (tables). Planned together with #245; shared decisions match. Follows [ADR-236](../decisions/236-m3-scope.md) and the `add-endpoint` skill.

### Approach

Start with `pnpm gen endpoint design 242`, then fill the placeholders. Same shape as clients (#29): route → service → `DesignRepository` port → Drizzle adapter through `withUser` (RLS is the guard, ADR-035) + memory fake. No new error code: `NOT_FOUND` (another user's design, ADR rule "behaves as if it did not exist"), `VALIDATION_FAILED`, `UNAUTHENTICATED`.

- `POST /api/designs` `{ category, title? }` → 201 `Design`. No title → default from `domain/design-title.ts`: category name in the caller's profile locale (`ProfileRepository.get`, fallback `ar`; words from `docs/design/copy.md` glossary) + the date in Africa/Cairo from the `Clock` port, e.g. `فستان 2026-10-19` / `Dress 2026-10-19`. No signed upload URLs (M6).
- `GET /api/designs?limit&offset&q&clientId` → `pageOf(designListItem)`, newest `updated_at` first. `q`: `ilike` on title with `escapeLike` (moved from `client-repository.ts` to `adapters/supabase/escape-like.ts`, both import it). `clientId`: `exists` a version whose `measurement_set_id` → set with that `client_id`. Each item has `summary: { versionCount, currentStatus: "pass"|"warn"|null, clientName: string|null }` (client of the current version's set; null if none or the set was deleted). One query: designs left join current version → set → client, plus a `count(*)` subquery.
- `GET /api/designs/:id` → `{ design, currentVersion: PatternVersion | null }` (stored inputs only, no regenerated pattern, no version list).
- `PATCH /api/designs/:id` `{ title }` → 200 `Design`; category is never changed.
- `DELETE /api/designs/:id` → 204; versions go by FK cascade (#237).

### Files

Create:

- `packages/schemas/src/designs.ts` (+ `designs.test.ts`): `createDesignInputSchema`, `updateDesignInputSchema` (title trimmed 1-120, matches the #237 check), `listDesignsQuerySchema` (`pageQuerySchema` + `q` max 120 + `clientId` uuid), `designSchema` (`id, category, title, currentVersionId, createdAt, updatedAt`; photos/analysis added in M6), `designListItemSchema`, `designDetailSchema`, `designPageSchema`, and **`patternVersionSchema`** (stored inputs: `id, designId, versionNo, spec, measurementSetId|null, measurements, sizeLabel, easeProfile, options, engineVersion, validationStatus: pass|warn, inputHash, createdBy, createdAt`). #245 reuses it; it is defined here because the detail route needs it first. All with `.meta({ example })` (reuse `seedDress` from `@tafsila/test-fixtures` for the spec example).
- `packages/api/src/ports/design-repository.ts`: `create, list, get (design + current version), rename, remove`.
- `packages/api/src/adapters/supabase/design-repository.ts`, `adapters/supabase/escape-like.ts`, `adapters/memory/design-repository.ts`.
- `packages/api/src/domain/design-title.ts` (+ test).
- `packages/api/src/services/{create-design,list-designs,get-design,rename-design,delete-design}.ts`, `services/designs.test.ts`.
- `packages/api/src/routes/designs.ts`, `routes/designs.test.ts`.
- `docs/test-cases/api/242-designs-api.md`.

Change: `packages/schemas/src/index.ts`, `packages/api/src/{container.ts,app.ts}`, `adapters/memory/memory-store.ts`, `adapters/supabase/{client-repository.ts,rejecting-repositories.ts,repositories.db.test.ts}`, `test-support/memory-app.ts`, `packages/api/openapi.json`, `postman/tafsila.postman_collection.json` + `postman/err-cases.json` (generated, plus one ERR case: rename with empty title → 422), `docs/SRS.md` §8 (five rows; `POST /api/designs` no longer "signed upload URLs" until M6; `GET /api/designs/:id` returns the current version, the list is #245), `docs/backend/README.md` (one "Designs" line), test-case index (`scripts/test-case-index.sh`).

### Data / API

No migration (tables from #237). Contract as above; paging `{ items, total, limit, offset }` (ADR-29a).

### Tests

- Service (memory): default title `ar` and `en` with a fixed clock; list order newest first; `q` matches `%` literally; `clientId` returns only designs with a version on that client's sets; summary counts 0/1/2 versions and `currentStatus` null for no version.
- Route integration (`routes/designs.test.ts`), per route: success status (201/200/200/200/204), 401 without token, 404 for user B on A's design (GET/PATCH/DELETE), 422 for bad body (`category: "coat"`, `title: ""`, `title` 121 chars, `limit: 0`, `clientId: "x"`).
- DB (`repositories.db.test.ts`, local Supabase): B's `list` never returns A's rows; delete cascades the seed design's 2 versions; `clientName` resolves through set → client.
- `pnpm api:check` green.

Manual cases `docs/test-cases/api/242-designs-api.md`: TC-API-242-01 Postman folder "Designs" CRUD (201, 200, 200, 200, 204) · -02 default title in Arabic for an `ar` profile · -03 list with `q` and `clientId` on the seed data · -04 another user gets 404 · -05 no token 401.

### Decisions (build writes `docs/decisions/242-designs-api.md`)

1. Default title = category word in the profile locale + Cairo date (`YYYY-MM-DD`); the user renames it.
2. `patternVersionSchema` (stored inputs, no result) lives in `packages/schemas/src/designs.ts` and is shared with #245.
3. `GET /api/designs/:id` returns the current version's inputs only; the regenerated pattern comes from `GET /api/versions/:id` (#245), so a design read stays cheap.
4. `summary.clientName` is the client of the current version's set; null when the set or client is gone.
5. List sort is `updated_at desc` (saving a version touches the design in #245).
6. `escapeLike` moves to `adapters/supabase/escape-like.ts` (no duplicate).

### Risks

- #237 not merged yet: build waits for it; the Drizzle names come from its `schema.ts`.
- List query cost (joins + count per row): fine at free-tier sizes; the `(owner_id, updated_at desc)` index from #237 covers the sort.

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no.

## Deviations

- `VALIDATION_FAILED` is 400 in the error catalogue, so bad bodies answer 400 (the plan said 422); the ERR Postman case expects 400.
- `toPatternVersion` lives in `adapters/supabase/pattern-version-row.ts` so #245 reuses it; the memory store gained `designs` and `versions` tables.
- Added the dress/skirt/blouse row to the copy glossary.
