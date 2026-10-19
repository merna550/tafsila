## Plan: #237 designs and pattern_versions tables with RLS

Plan wave M3, 2026-10-19. No dependencies (M1 schema #24 closed). Follows [ADR-236](../decisions/236-m3-scope.md) items 2-4.

### Approach

One new migration, same style as `20261011120000_m1_schema.sql` (owner default `auth.uid()`, `revoke all` then explicit grants, one owner policy, `is_admin()` for admin read). The API keeps connecting as `api_app` and running `set local role authenticated` (ADR-035), so RLS is the only guard.

### Files

Create:

- `supabase/migrations/20261019120000_designs_and_versions.sql`
  - `designs`: `id uuid pk`, `owner_id uuid not null default auth.uid() references profiles on delete cascade`, `category text not null check (category in ('dress','skirt','blouse'))`, `title text not null check (length(title) between 1 and 120)`, `photo_paths text[] not null default '{}'`, `analysis jsonb`, `current_version_id uuid` (FK added after `pattern_versions`, `on delete set null`, deferrable), `created_at`, `updated_at` (trigger `set_updated_at` if M1 has one, else `now()` on update in the API). `unique (id, owner_id)` for the composite FK below. Index on `(owner_id, updated_at desc)` for the list.
  - `pattern_versions`: `id uuid pk`, `design_id uuid not null`, `owner_id uuid not null default auth.uid()`, `foreign key (design_id, owner_id) references designs (id, owner_id) on delete cascade` (a version can only point at a design of the same owner, like `measurement_sets` → `clients`), `version_no int not null check (version_no >= 1)`, `unique (design_id, version_no)`, `spec jsonb not null`, `measurement_set_id uuid references measurement_sets on delete set null`, `measurements jsonb not null` (snapshot), `size_label text`, `ease_profile text not null check (ease_profile in ('fitted','regular','loose'))`, `options jsonb not null default '{}'`, `engine_version text not null`, `validation_status text not null check (validation_status in ('pass','warn'))` (a `fail` is never stored, ADR-236 item 4), `input_hash text not null`, a plain (non-unique) index on `(design_id, input_hash)`; "same inputs return the existing version" applies only to the design's current version and is checked by the API (#245), so a restore can still add a new row with an older version's inputs, `created_by text not null default 'user' check (created_by in ('user','chat'))`, `created_at`.
  - Grants: `designs` select/insert/update/delete to `authenticated`; `pattern_versions` **select/insert only** (append-only, item 3). Policies: `*_owner` for all (`owner_id = auth.uid()`), `*_admin_read` for select (`is_admin()`).
  - `version_no` is assigned by the API inside one transaction (`max + 1` with the unique constraint as the guard); no sequence per design.
- `supabase/tests/database/designs.test.sql` (pgTAP, same fixture style as `rls.test.sql`: users A, B, admin C).

Change:

- `packages/api/src/adapters/supabase/schema.ts` (+ `schema.test.ts`): Drizzle tables `designs`, `patternVersions`; `database.types.ts` regenerated with `pnpm db:types`.
- `supabase/seed.sql`: one dress design for the seed user (`seedDress` spec from `@tafsila/test-fixtures`, inlined as JSON) with versions 1 and 2 (v2 changes the sleeve), measurement snapshot from the seed client's set, `engine_version` = current `ENGINE_VERSION`, `input_hash` computed once by a small script and pasted (documented how in `docs/backend/seed-data.md`).
- `docs/SRS.md` §7: add `owner_id`, `measurements` snapshot, `size_label`, `updated_at`, the `pass|warn` only rule and append-only note.
- `docs/backend/seed-data.md`: the new rows.
- Account deletion: no change needed (both tables cascade from `profiles`); a pgTAP case proves it.

### Data / API

Schema only; no endpoint (that is #242, #245). No OpenAPI change.

### Tests (pgTAP, `pnpm db:test`)

- A inserts a design and a version; A reads both; B reads 0 rows of each; B cannot insert a version for A's design (composite FK + policy); admin C can select both, cannot insert for A.
- `update` and `delete` on `pattern_versions` as A fail with `permission denied`.
- Deleting A's design deletes its versions; deleting the measurement set keeps the version with `measurement_set_id` null and the snapshot intact.
- Duplicate `(design_id, version_no)` raises `unique_violation`; two versions of one design may share an `input_hash` (restore case); `validation_status = 'fail'` raises `check_violation`.
- Deleting A's profile (account deletion path) removes designs and versions.
- `api_app` alone (without `set role authenticated`) has no table access.
- `pnpm db:reset` applies migration + seed (CI `db-reset` job).

Manual test cases: `docs/test-cases/db/237-designs.md` TC-DB-237-01..03 (reset, seed visible in Studio for the seed user, RLS spot check).

### Decisions (build writes `docs/decisions/237-designs-schema.md`)

1. Composite FK `(design_id, owner_id)` so a version can never belong to another user's design.
2. No unique constraint on `input_hash`: dedupe is an API rule against the current version only (#245), because a restore must be able to add a new version with an older version's inputs (ADR-236 item 3).
3. `validation_status` check allows only `pass` and `warn` (failing patterns are never saved).
4. `version_no` assigned by the API in a transaction; the unique constraint is the race guard (retry once on conflict).
5. `title` 1-120 chars; `category` limited to the three M3 categories (new ones are a migration).

### Risks

- `current_version_id` ↔ `pattern_versions` is a cycle: add the FK after both tables, `deferrable initially deferred`, `on delete set null`.
- Seed `input_hash` drifts when `ENGINE_VERSION` changes: the hash is only a dedupe key, a stale seed hash is harmless; documented.

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no.

## Deviations

None. The Drizzle mirror and `database.types.ts` were edited by hand because `pnpm db:types` needs Docker, which this cloud session lacks. `updated_at` has no trigger (M1 has none), the API sets it.
