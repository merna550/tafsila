## Plan: #369 Design-sharing consent and admin views of shared designs and unsupported features

Plan wave M7, 2026-11-02. No dependencies. Follows [ADR-365](../decisions/365-m7-scope.md) item 11 and ADR-32a (admin functions in `private`, `assert_admin`, audit, column checks).

### Approach

A consent column on `profiles` that the owner can change, and two admin read functions in `private` that join only consenting owners' designs and only non-identifying unsupported-feature rows. API routes follow the existing admin routes from #32 (`/api/admin/users`), and the profile route from M1.

### Files

Create:

- `supabase/migrations/20261103130000_share_designs.sql`:
  - `alter table profiles add share_designs boolean not null default false, add share_designs_changed_at timestamptz`; column-level `grant update (share_designs) on profiles to authenticated` (check the existing profile update grants and keep them); a trigger sets `share_designs_changed_at = now()` when the value changes.
  - `private.admin_shared_designs(p_admin uuid, p_limit int, p_offset int)` → table (`design_id`, `category`, `title`, `current_spec jsonb`, `created_at`, `owner_display_name`, `photo_paths text[]`): `perform private.assert_admin(p_admin)`; joins `designs` ⨝ `profiles` where `share_designs`; spec from the current version (`pattern_versions.spec`); **no** `measurements`, `measurement_set_id`, client or notes columns.
  - `private.admin_unsupported_features(p_admin, p_limit, p_offset)` → table (`text`, `category`, `created_at`): no user id or design id.
  - `execute` to `api_app` only; one `admin_audit` row per call (`action 'admin.designs.list'` / `'admin.unsupported.list'`), like `admin_users`.
- `supabase/tests/database/share-designs.test.sql` (pgTAP).
- `packages/api/src/services/admin-designs-service.ts` (+ test), routes in the existing admin router: `GET /api/admin/designs?limit&offset`, `GET /api/admin/unsupported-features?limit&offset`; photos returned as 5-minute signed URLs via the existing photo storage port (`photo-storage.ts`).
- `packages/schemas/src/admin.ts` (or the existing admin schemas file): `adminSharedDesignSchema`, `adminUnsupportedFeatureSchema`, list envelopes (same paging as `/api/admin/users`).

Change:

- Profile: `PATCH /api/profile { shareDesigns: boolean }` and `shareDesigns` in `GET /api/profile` (`profile-repository.ts` port + supabase adapter + memory adapter, `profileSchema`).
- `packages/api/src/ports/admin-repository.ts` + supabase/memory adapters: two list methods.
- OpenAPI (`pnpm api:openapi`), Postman (`pnpm api:postman`; admin requests in the admin folder that Newman skips, as for users), `pnpm api:check`.
- `supabase/seed.sql` + `docs/backend/seed-data.md`: one consenting seed user with one design; the default seed user stays non-consenting.
- `docs/SRS.md` §7 (`profiles.share_designs`), FR-ADM-03 note.

### Data / API

One column + two functions; three routes (one PATCH, two GET). Error codes: non-admin → existing `FORBIDDEN` (403) mapped from `42501`.

### Tests

- pgTAP: consenting user's design visible to admin C; non-consenting invisible; consent off → invisible again; non-admin calling the function → `42501`; the function's result columns contain no `measurements`/`measurement_set_id`/notes (column-name check on the function's return type as in ADR-32a 4); an audit row per call; owner can update `share_designs`, cannot update other profile columns through this grant.
- API: 403 for non-admins on both GETs; admin list + pagination; no measurement key anywhere in the JSON (deep key scan); profile toggle round trip (PATCH then GET).
- Manual: `docs/test-cases/api/369-admin-shared-designs.md` TC-API-369-01..03.

### Decisions (build writes `docs/decisions/369-share-designs.md`)

1. Consent is one boolean on `profiles` with a change time (no history table in M7).
2. Admin sees only the current version's spec, never measurements, clients or notes; photos as 5-minute signed URLs.
3. Unsupported-feature rows are returned without any user or design id.
4. Each admin list call writes an `admin_audit` row.

### Risks

- Column-level grants on `profiles` may already exist for other columns: the build reads the current grants and adds only `share_designs`, with a pgTAP check that other columns stay non-updatable.
- Signed URLs for many photos per page: limit 20 per page, sign lazily per design.

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no.

### Deviations

- Photo URLs for a page are signed in one storage call (limit 20 per page) instead of lazily per design; the 5-minute lifetime is unchanged.
- The in-memory unsupported-feature rows now carry `createdAt` so the memory admin repository can sort them.
- Designs without a current version are not listed (inner join), since the admin view is about the spec.
