# Plan #245: pattern versions endpoints (save, list, read, restore)

Plan comment: <https://github.com/merna550/tafsila/issues/245#issuecomment-6273996741>.

Plan wave M3, 2026-10-19. Depends on #237 (tables), #238 (engine exports), #242 (designs routes, `patternVersionSchema`). Planned together with #242. Follows [ADR-236](../decisions/236-m3-scope.md) items 1-4 and the `add-endpoint` skill.

### Approach

Route → service → `PatternVersionRepository` port → Drizzle adapter (`withUser`, ADR-035) + memory fake. The engine is pure, so the service calls it through a small domain helper, like `domain/measurements-check.ts` already does.

**Save** `POST /api/designs/:id/versions` `{ spec, measurementSetId, easeProfile, options }`:

1. Zod: `spec` = `designSpecSchema`, `measurementSetId` uuid (required, ADR-236 item 6), `easeProfile`, `options` = `engineOptionsSchema.pick({ seamAllowance, fabricWidthMm })`. Bad body → 422 `VALIDATION_FAILED`. `spec.category` ≠ design category → 422 `VALIDATION_FAILED` (field `spec.category`).
2. Load the set with `MeasurementSetRepository.get` (RLS: foreign or missing → 404 `NOT_FOUND`) and, if it has a client, the client name.
3. Build full engine options: `sizeLabel = set.sizeLabel ?? set.label`, `clientLabel` = client name (snapshotted in `options`, FR-PAT-02), plus `easeProfile` and the posted options.
4. `domain/run-pattern.ts`: `generatePattern(spec, set.measurements, options)`, timed with the `Clock` port. Combination refusals come from the engine report itself (the #238 predicates run inside it), so there is no second rule check. `fail` → 422 **`PATTERN_INVALID`** with `details: { report }` (new catalogue code), nothing written (item 4).
5. Repository `appendVersion` in **one `withUser` transaction**: `select … from designs where id = $1 for update` (404 if not visible; the lock serialises saves of one design), read the current version's `input_hash`; if equal to the new hash → return that version (`reused: true`, 200). Else insert with `version_no = max + 1`, set `designs.current_version_id` and `updated_at`, return 201. Stored: spec, measurements snapshot, size label, ease, options, `measurement_set_id`, `engine_version`, `validation_status`, `input_hash`, `created_by: "user"`.
6. Response `{ version: PatternVersion, report: ValidationReport, reused: boolean }`; header `Server-Timing: engine;dur=<ms>`; analytics event `pattern_version_saved { category, validation_status, engine_ms, reused }` (no measurements, ADR-025).

**List** `GET /api/designs/:id/versions?limit&offset` → `pageOf(patternVersionListItem)` newest `version_no` first; item = `id, versionNo, validationStatus, engineVersion, sizeLabel, easeProfile, measurementSetId, createdBy, createdAt, isCurrent` (no spec/measurements). Foreign design → 404.

**Read** `GET /api/versions/:id` → `{ version, pattern: PatternResult, engineChanged }`: pattern regenerated from the stored inputs (item 2); `engineChanged = version.engineVersion !== ENGINE_VERSION`. The fresh report is returned, never written back.

**Restore** `POST /api/versions/:id/restore` (no body) → same as save, with the old version's stored spec, **measurements snapshot** (not the live set), ease and options, `measurement_set_id` copied. Restoring the current version returns it (200, `reused`); any older version becomes n+1 (201). If today's engine fails it → 422 `PATTERN_INVALID`.

### Cross-issue fix needed in #237

The #237 plan has `unique (design_id, input_hash)`. That blocks restore (v1's inputs already exist, so "restore creates n+1" cannot insert). This plan dedupes against the **current version only** (double-submit and retry safe, enforced by the row lock). **#237's plan should drop that unique constraint** (decision 2 there). If #237 is already merged with it, this build adds `supabase/migrations/<ts>_versions_hash_not_unique.sql` (drop the constraint, add a plain index on `(design_id, input_hash)`) and updates the pgTAP case.

### Files

Create:

- `packages/schemas/src/pattern-versions.ts` (+ test): `savePatternVersionInputSchema`, `listPatternVersionsQuerySchema`, `patternVersionListItemSchema`, `patternVersionPageSchema`, `savePatternVersionResultSchema`, `patternVersionDetailSchema` (reuses `patternVersionSchema` from #242, `validationReportSchema`, `patternResultSchema`).
- `packages/api/src/ports/pattern-version-repository.ts` (`appendVersion`, `list`, `get`).
- `packages/api/src/adapters/supabase/pattern-version-repository.ts`, `adapters/memory/pattern-version-repository.ts`.
- `packages/api/src/domain/run-pattern.ts` (+ test): build options, run, time, map `fail` to `AppError("PATTERN_INVALID")`.
- `packages/api/src/services/{save-pattern-version,list-pattern-versions,get-pattern-version,restore-pattern-version}.ts`, `services/pattern-versions.test.ts`.
- `packages/api/src/routes/pattern-versions.ts`, `routes/pattern-versions.test.ts`.
- `docs/test-cases/api/245-pattern-versions-api.md`.

Change: `packages/schemas/src/{index.ts,analytics-events.ts}`, `packages/api/src/domain/errors.ts` (`PATTERN_INVALID`, 422, ar/en), `docs/errors.md`, `packages/api/src/{container.ts,app.ts}`, `adapters/memory/memory-store.ts`, `adapters/supabase/{rejecting-repositories.ts,repositories.db.test.ts}`, `test-support/memory-app.ts`, `packages/api/openapi.json`, `postman/tafsila.postman_collection.json`, `postman/err-cases.json` (ERR: save with a refused spec → 422 `PATTERN_INVALID`), `docs/SRS.md` §8 (four rows; `GET /api/designs/:id` no longer lists versions) and §7 if the hash rule changes, `docs/backend/README.md` (one "Pattern versions" line: server re-runs the engine, append-only, restore), test-case index.

### Data / API

No migration unless the #237 fix above is needed. New error code `PATTERN_INVALID`. No credits (item 5). No `ENGINE_VERSION` change.

### Tests

Service (memory, fixed clock, `seedDress` + size M set from `@tafsila/test-fixtures`):

- Save `pass` → 201, version 1, design current = v1. Save a `warn` spec → 201 v2, `validation_status: "warn"`.
- Save a spec the engine refuses (dress `waistSeam: false` + gathered skirt) → 422 `PATTERN_INVALID`, `details.report.status === "fail"`, no row, current unchanged.
- Same body twice → second is 200, same id, `reused: true`, count unchanged.
- Restore v1 while current is v2 → 201 v3 with v1's spec and snapshot; restore v3 (current) → 200 same id.
- Restore after the set was edited uses the snapshot (hash equals v1's).
- `spec.category: "skirt"` on a dress design → 422.

Route integration + permissions:

- 401 on all four routes without a token; B saving to A's design, B using A's measurement set on B's design, B listing/reading/restoring A's version → 404 each.
- Bad bodies → 422 (`measurementSetId` missing, `easeProfile: "tight"`, `options.fabricWidthMm: 0`).
- Read returns `pattern.pieces.length > 0` and `engineChanged: false`; with a stored `engineVersion: "0.0.1"` → `engineChanged: true`.
- `Server-Timing` header present; one `pattern_version_saved` event captured by the memory analytics.

DB (`repositories.db.test.ts`, local Supabase):

- **Rollback:** make the `current_version_id` update fail inside `appendVersion` (point it at a deleted design id via a test hook) → no version row and `version_no` unchanged.
- Two parallel saves with different specs → v n+1 and n+2, no unique error (row lock).
- A version row is never updated or deleted by the API role (grants from #237).

Speed: log engine ms for `seedDress` sizes S/XXL in the test output; assert < 2 s (well under the Vercel Hobby 10 s default limit).

Manual cases `docs/test-cases/api/245-pattern-versions-api.md`: TC-API-245-01 Postman save → list → read → restore (201, 200, 200, 201) · -02 refused spec gives 422 with report · -03 save twice returns same version · -04 foreign set 404 · -05 staging: `Server-Timing` engine time recorded in the PR · -06 read a seed version after an engine bump shows `engineChanged: true`.

### Decisions (build writes `docs/decisions/245-pattern-versions-api.md`)

1. "Same inputs return the existing version" means the same as the **current** version (double-submit/retry); restoring an older version always appends n+1 (needs the #237 change above).
2. The design row is locked `for update` in the save transaction; `version_no = max + 1` and `current_version_id` change together.
3. Restore uses the stored measurement snapshot, not the live set, and re-runs today's engine; a now-failing version cannot be restored (422).
4. `sizeLabel` = set size label or set label; client name is snapshotted into `options.clientLabel`.
5. Request `options` = seam allowance + fabric width only; ease is its own field; size and client labels come from the server.
6. Combination refusals come from the engine report (no separate `specOptions` call in the API): one rule source.
7. Save returns 201 (new) or 200 (reused) with `{ version, report, reused }`; read regenerates and never writes.
8. Engine time is reported via `Server-Timing` and the `pattern_version_saved` analytics event; no new logger port.

### Risks

- Engine time / bundle on Vercel Hobby: measured in tests and on staging (TC-245-05); the route does one engine run per request.
- Regenerated result differs after an engine change: flagged by `engineChanged`; the stored `validation_status` stays the saved one.
- Large `PatternResult` on read: only the read route returns it; the list is light.
- #237 constraint conflict: handled above; flagged to Merna.

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged; the transaction and lock are spelled out). `needs-interactive`: no.

## Deviations

- Bad bodies return 400 `VALIDATION_FAILED` (the catalogue status, as in ADR-242), not 422; the plan said 422.
- The #237 unique-constraint fix was already merged (`input_hash` is an index, not unique), so no migration was added.
- The Postman ERR case is "unknown measurement set returns 404": the 422 `PATTERN_INVALID` case needs a real set id, and seed sets have random ids. The 422 is covered by the service and route tests.
- The container field is `versions` (the services take `{ versions }`).
