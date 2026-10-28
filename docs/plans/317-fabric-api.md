# Plan #317: Fabric tables, recommend and save endpoints, admin fabric APIs

Copy of the approved plan comment (https://github.com/merna550/tafsila/issues/317#issuecomment-6464234550).

plan:sonnet · build:sonnet · size M (unchanged) · M5 wave 3 · FR-REC-02, FR-REC-03, FR-ADM-02, NFR-04, SRS §7, §8 · ADR-312 items 5, 6, 8 · follows ADR-32a (admin through RLS) and ADR-24a (RLS style)

### Approach

Follow `.claude/skills/add-endpoint` for each route (schema → service → port/adapter → route → tests → OpenAPI/Postman → seed docs → tutorial). The catalogue, rules and last calculation live in three tables; `recommend` stays pure in `@tafsila/fabric-kb`.

**Migration `supabase/migrations/<ts>_fabrics.sql`:**

- `fabrics` (`id text primary key` slug from the package, `name_ar`, `name_en`, `properties jsonb`, `care_notes jsonb`, `is_draft boolean`, `created_at`, `updated_at`, `updated_by`); `fabric_rules` (`id text primary key`, `condition jsonb`, `required_properties jsonb`, `priority smallint`, `reason jsonb`, `is_draft`, timestamps). Columns map one to one to the `@tafsila/fabric-kb` types so no translation layer is needed (the SRS §7 columns are kept as the JSON fields; SRS updated for `body`, `strength`, `reason`).
- RLS on: `select` for `authenticated`; `insert/update/delete` only when the profile role is admin (same predicate as `size_charts_admin_write`).
- `fabric_calcs` (`id uuid`, `pattern_version_id uuid references pattern_versions on delete cascade`, `options jsonb`, `result jsonb`, `nesting_version text`, `created_at`, `updated_at`), unique on (`pattern_version_id`, `options_hash`) so the last calculation per version and options is replaced. RLS: owner only, through `pattern_versions → designs.owner_id` (like `pattern_versions_owner`), plus admin read like `designs_admin_read`.
- **Seed in the migration** from the package's draft data: a generator script (like `scripts/gen-size-chart-sql`, ADR-31a) prints the `insert ... on conflict do nothing` SQL; a unit test compares the migration file with the generator output (acceptance criterion), so the two never drift.
- Drizzle schema mirror for the three tables (the repo keeps one, see the add-endpoint skill).

**Routes** (all behind `requireAuth`; admin ones also `requireRole("admin")`):

- `GET /api/fabrics/recommend?versionId=` loads the version (owner's, else 404), reads the catalogue and rules, runs `recommend` from `@tafsila/fabric-kb` on the version's `DesignSpec`, returns `{ recommended, avoid, isDraft }`.
- `PUT /api/versions/:id/fabric` stores or replaces the calculation (body: `options` as `fabricOptionsSchema` from #315, `result`, `nestingVersion`); the server validates the shapes and that lengths are positive multiples of 0.1 m; `GET /api/versions/:id/fabric?<options>` or the latest returns it; a version not owned gives 404 (the same code the pattern-versions routes use). Using `PUT` keeps one row per version and options (SRS §8 says POST and GET; the contract is documented as an update in the SRS in this PR).
- Admin: `GET/POST/PATCH/DELETE /api/admin/fabrics[/:id]` and `/api/admin/fabric-rules[/:id]`. Inputs validated by the `@tafsila/fabric-kb` rule validation (unknown path/value gives `422 FABRIC_RULE_INVALID` with the field details). Each write and its `admin_audit` row (`fabric.created|updated|deleted`, `fabric_rule.*`, target id, `before`/`after`) run in one `withUser` transaction as in ADR-32a item 5; a write that touches no row (stale admin token) throws `FORBIDDEN` and writes no audit.
- Error codes (bilingual): `FABRIC_NOT_FOUND`, `FABRIC_RULE_NOT_FOUND`, `FABRIC_RULE_INVALID`, `FABRIC_CALC_INVALID`, `FABRIC_ID_TAKEN` (409); catalogue in `domain/errors.ts` and `docs/errors.md`.

### Files

- `supabase/migrations/<ts>_fabrics.sql`, `supabase/tests/database/fabrics.test.sql`, `scripts/gen-fabric-sql.ts` (or under `packages/fabric-kb/scripts`) + its drift test.
- `packages/schemas/src/`: `fabric-calc.ts` (calc body/response), `fabric-admin.ts` (admin inputs/outputs), exports and tests (`fabric.ts` from #314 reused).
- `packages/api/src/`: `ports/fabric-repository.ts`, `ports/fabric-calc-repository.ts`; `adapters/supabase/` and `adapters/memory/` for both; services `get-fabric-recommendations.ts`, `save-fabric-calc.ts`, `get-fabric-calc.ts`, `list-fabrics.ts`, `create-fabric.ts`, `update-fabric.ts`, `delete-fabric.ts`, same for rules (or one `admin-fabric-shared.ts` for the audit step to avoid duplication); routes `fabrics.ts` (recommend), `fabric-calcs.ts`, extend `admin.ts` (or `admin-fabrics.ts` if `admin.ts` grows too big); container wiring; tests next to each.
- `packages/api` Drizzle schema, OpenAPI (`pnpm api:openapi`), Postman (`pnpm api:postman`), `pnpm api:check`.
- Docs: `docs/SRS.md` §7/§8, `docs/backend/seed-data.md` (fabrics come from a migration), `docs/backend/tutorials/` (edit a fabric rule through the API), `docs/errors.md`, `docs/CONTEXT_MAP.md`, decision `docs/decisions/317-fabric-api.md`, test cases `docs/test-cases/api/317-fabrics.md`.

### Test plan

- **Services (memory adapters):** recommend for `vNeckHalfCircleDress`'s saved version returns 3 to 5 with reasons and an avoid list; another user's version gives 404; calc save then read returns the same options/result; a second save with the same options replaces it (one row); invalid result (negative length, length not a multiple of 0.1) gives 422 `FABRIC_CALC_INVALID`; admin create then audit row written with before/after; non-admin 403; duplicate id 409; a rule with `skirt.typ` gives 422 `FABRIC_RULE_INVALID`; a stale-admin update writes no audit.
- **Routes:** 401 without token on each; 403 for a normal user on admin routes; 200/201/204 shapes validated against the Zod schemas; OpenAPI document test.
- **Drift:** the migration seed equals the generator output equals the package's draft data (16 fabrics, 21 rules).
- **pgTAP (`fabrics.test.sql`):** authenticated can read fabrics and rules; a non-admin insert/update/delete is denied; an admin can write; owner reads own calc, another user cannot read or write it (zero rows); admin read allowed; deleting a version cascades its calcs; audit rows exist for admin writes made through the function path.
- **Newman/Postman:** cases for recommend and calc (happy and 404); the admin folder is not run by Newman (ADR-32a item 13), hand-written 401/403 cases only.
- DB tests, pgTAP and real-adapter tests cannot run without Docker here; CI runs them, and the PR is not merged until CI is green.

Manual test cases (draft): TC-API-317-01 recommend for a saved version; 02 save and read a calc; 03 another user's version is 404; 04 admin edits a fabric and the audit row appears; 05 non-admin gets 403; 06 invalid rule rejected with the field named.

### Decisions to log (`docs/decisions/317-fabric-api.md`)

1. Tables keep ids as the package slugs (stable for rules and the migration seed); JSON columns match the package types.
2. `PUT` (replace the last calculation per version and options) instead of `POST`; one row per version and options; the SRS is updated.
3. Seed by migration from a generator with a drift test (same pattern as ADR-31a).
4. Draft flag stored per row so the UI can show "draft" until Merna's review flips it.
5. Admin writes reuse the ADR-32a transaction + audit pattern; non-admins get 403.

None is costly to reverse, so no `needs:decision`. This is the first new table since M3 and it is RLS-sensitive: the plan lists pgTAP for it, and the reviewer should read the policies once.

### Risks

- **RLS mistakes:** policies copied from `size_charts` and `pattern_versions`, pgTAP covers non-owner/non-admin.
- **Migration/package drift:** the drift test.
- **Large `result` payloads** (placements): cap the body size and the number of placements in the schema.
- **Admin route file growth:** a separate `admin-fabrics.ts` route file.

### Labels and needs

Size M, `plan:sonnet`, `build:sonnet` stay. `node scripts/needs-interactive.mjs supabase/migrations/x.sql packages/api/src/routes/admin-fabrics.ts` must be run by the builder at the start (schema/RLS files); if it says `yes`, the dispatcher will not build it and it needs an interactive session.

## Deviations

- `GET /api/versions/:id/fabric` returns the latest saved calculation only; the optional options query was not added (no screen needs it yet, decision 317 item 2).
- `GET /api/admin/fabrics/:id` and `GET /api/admin/fabric-rules/:id` are not built: the list returns every row (16 and 21) and the editor needs nothing else. `GET`, `POST`, `PATCH` and `DELETE` exist on the collections as listed in the SRS.
- `fabric_calcs` has an `owner_id` column and a composite foreign key to `pattern_versions (id, owner_id)` (a unique constraint is added to `pattern_versions`) instead of a policy that joins through `designs`; the effect is the same and the policy is cheaper.
- The recommend response has no fabric names; the screen joins `fabricId` with the catalogue it already loads.
- The fabric-kb generator lives in `packages/fabric-kb` (`src/seed-sql.ts`, `scripts/gen-sql.ts`) and its drift test in the same package.
- The Newman journey (`postman/journey.json`) covers recommend and the calculation; `fabrics` is added to the journey folders in `scripts/gen-postman.mjs` so the generated folder is not also run without ids.
