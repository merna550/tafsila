# Plan #32: Mini admin — users list and Egyptian size-chart editor

Issue: #32 · plan:sonnet · build:sonnet · size:M → **size:L** (two PRs) · Milestone: M1 - Accounts & data · FR-MEAS-01, FR-ADM (partly) · Design: `AdminUsers.dc.html`, `AdminSizes.dc.html`

Decided by Merna (2026-10-13): own `packages/ui` components (no Refine / React-admin); build the editor with CSV import, the real Egyptian chart values are loaded by Merna afterwards.

> **Status:** Part A (database functions and API) is built in the branch `feat/32-admin-api` (ADR-32a). Part B (web screens) is built in the branch `feat/32-admin-web` (decision 32b).

## Context

Merna needs to watch sign-ups and edit the standard size chart from inside the app (FR-MEAS-01 "chart editable by admin", FR-ADM partly). Today there is no admin route, no write path for size charts and no way to list users: `size_charts` and `admin_audit` already exist with admin-only write RLS, `requireRole("admin")` exists but only a test uses it, the default chart in the DB is a PLACEHOLDER (S–XXL, 18 measurements, ADR-024 fixes S–XXL), and the AdminUsers / AdminSizes designs are approved. Merna's answers (this session): build the editor plus CSV import and she loads the real values afterwards; use our own `packages/ui` components, no Refine/React-admin. Size goes S → **L**, built as two PRs ("Part of #32"): **A** database + API, **B** web.

## Approach

### Part A — database and API (hexagonal, copy the profile/account endpoints)

- **Users list needs data RLS hides** (email and `last_sign_in_at` live in `auth.users`; other users' clients are owner-only). Use the existing pattern: `private` schema, `security definer`, `set search_path = ''`, `execute` only for `api_app` and `service_role`, called through `withApiRole`. New migration `supabase/migrations/<ts>_admin_functions.sql`:
  - `private.admin_users(p_admin uuid, p_q text, p_verified boolean, p_limit int, p_offset int)` → rows `(id, name, email, phone, phone_verified_at, created_at, last_sign_in_at, client_count, total)`; search by name, email or phone; client **count only**, never measurements or notes.
  - `private.admin_user(p_admin uuid, p_id uuid)` (read-only detail), `private.admin_stats(p_admin uuid)` (users, verified phones, sign-ups today / 7 days, clients).
  - Each function re-checks `exists(select 1 from public.profiles where id = p_admin and role = 'admin')` and raises otherwise (the token role can be up to an hour stale; the database is the second fuse).
- **Size chart write** needs no new function: the admin RLS policies already allow `size_charts` update and `admin_audit` insert (`who = auth.uid()`), so do both in one `withUser` transaction, setting `updated_by` and `updated_at` explicitly (nothing sets them).
- **Routes** (`routes/admin.ts`, all with `requireAuth` + `requireRole("admin")`, `createRoute` + `.openapi`):
  - `GET /api/admin/stats`, `GET /api/admin/users` (`q`, `verified`, `limit`, `offset`; reuse the paging helpers from clients), `GET /api/admin/users/{id}`.
  - `GET /api/admin/size-charts/default` → `{ id, name, sizes, updatedAt, updatedBy (display name only), isPlaceholder }`.
  - `PUT /api/admin/size-charts/default` `{ name?, sizes }`: validate with `sizeChartSchema`, then `validateMeasurements` for every size (errors → `422` with per-size/per-field issues, warnings returned and saved); write chart + one `admin_audit` row `{ action: "size_chart.updated", target: chart id, before, after }`.
- Ports/adapters: `AdminRepository` (users, user, stats) with a Supabase adapter (`withApiRole`) and memory adapter; extend `SizeChartRepository` (`ports/size-chart-repository.ts`, currently `getDefault` only) with `replaceDefault(admin, input)` writing chart + audit in one transaction (Supabase adapter via `withUser`, memory twin). Services (one use case per file): `list-admin-users`, `get-admin-user`, `get-admin-stats`, `get-admin-size-chart`, `update-default-size-chart`.
- Errors: reuse `FORBIDDEN` (403) and `VALIDATION_FAILED`; one new code `SIZE_CHART_INVALID` (422, details `{ issues }`) in `ERROR_CATALOGUE` and `docs/errors.md`.
- Postman: add `"admin"` to `SKIPPED_FOLDERS` in `scripts/gen-postman.mjs` (Newman has no admin token), hand ERR cases for 401/403; `pnpm api:openapi && pnpm api:postman && pnpm api:check`.
- Docs: `docs/backend/tutorials/make-a-user-admin.md` (SQL snippet via the service role / SQL editor; the role reaches the token at its next refresh, up to one hour).

### Part B — web (feature-sliced, copy `features/clients`)

- Routes: `app/[locale]/(admin)/admin/` with its own layout (dark header "لوحة الإدارة", side nav المستخدمون / جدول المقاسات only; "نظرة عامة" and "سجل التعديلات" in the design are `href="#"` and are not built), `/admin` redirects to `/admin/users`, pages `users`, `users/[id]`, `sizes`.
- **Admin gate:** add `/admin` to `PROTECTED_PREFIXES` in `shared/auth/access-guard.ts` (+ test, both languages). The admin layout reads the `user_role` claim of the session token on the server (new `getSessionRole()` in `shared/auth/server.ts`; no network call) and calls `notFound()` for non-admins. Add `app/[locale]/not-found.tsx` in the design system (none exists, Next's default would render). The API stays the real boundary (403). `AppNav` gets an optional `isAdmin` prop from the server layout to show an "الإدارة" link.
- `features/admin-users/` (model, hooks with TanStack Query, components): stat tiles, debounced search, segmented filter الكل / مؤكَّد / غير مؤكَّد, table (الاسم + LTR email, الهاتف + `Badge`, التسجيل, العميلات, آخر تسجيل دخول), "load more" paging, footer privacy note from the design, read-only detail page. Loading / empty / error through `DataState`.
- `features/admin-sizes/`: `SizeGrid` (own table markup, `th scope="row"` first column, `Input` cells, cm with one decimal on screen / mm in data; all 18 measurements grouped like the measurements form of #31 — reuse its field list and groups), dirty cells (peach), invalid cells (`aria-invalid`, message under the grid) from the engine's `validateMeasurements`, save bar "حفظ التعديلات (n)" disabled while invalid or unchanged, discard confirmation `Dialog`, the "مؤقت" banner while `isPlaceholder`, last editor and time.
- **CSV (no new dependency):** pure functions in `features/admin-sizes/model/size-chart-csv.ts`: export `measurement,S,M,L,XL,XXL` with camelCase measurement keys in cm; import parses quotes, BOM, `\r\n`, decimal comma, unknown or missing rows → a preview `Dialog` listing problems, then the same `PUT` (the API stays JSON); the import dialog asks for the chart name (default "Egyptian size chart") so the placeholder banner goes away.
- `packages/ui`: new `StatTile` and `SegmentedControl` with unit tests. **Do not add visual stories now**: new stories need Linux baselines (Docker), which is not available in the cloud sessions (lesson of #27); add stories in the same PR that regenerates baselines.
- Messages `admin.*` in `ar.json` and `en.json`; `docs/design/copy.md` glossary rows (users، audit log if used, import/export).

## Decisions (written to `docs/decisions/32-mini-admin.md`)

1. Own `packages/ui` components, no Refine / React-admin (Merna, this session): no new dependency, matches RTL and tokens.
2. Users list through `private` security-definer functions via `withApiRole`, admin re-checked inside the database; counts only. (Privacy: admin sees emails and phones, as the design shows, never measurements or notes.)
3. Chart edits through `withUser` as the admin (existing RLS), chart + audit in one transaction.
4. CSV is a client-side format; the API only accepts JSON.
5. API answers non-admins `403 FORBIDDEN` (standard contract); pages answer 404 so the admin area is not advertised.
6. Role on the page comes from the token claim (stale up to 1 hour, documented); the API and database re-check.
7. The real Egyptian chart is data, not a migration: Merna imports it per environment. A follow-up small PR then updates `packages/test-fixtures/src/size-chart-sql.ts` and its migration so new environments start with it (the drift test requires both).

## Critical files

- DB/API: `supabase/migrations/` (new), `packages/api/src/routes/admin.ts`, `services/*admin*`, `ports/size-chart-repository.ts`, `adapters/supabase|memory/size-chart-repository.ts`, `adapters/supabase|memory/admin-repository.ts`, `container.ts`, `app.ts`, `domain/errors.ts`, `packages/schemas/src/admin.ts`, `scripts/gen-postman.mjs`; reuse `requireRole` (`middleware/auth.ts`), `createWithApiRole` (`adapters/supabase/with-user.ts`), `validateMeasurements` (`packages/engine/src/measurements`), `sizeChartSchema` (`packages/schemas/src/size-chart.ts`).
- Web: `app/[locale]/(admin)/admin/**`, `shared/auth/access-guard.ts`, `shared/auth/server.ts`, `shared/layout/AppNav.tsx`, `features/admin-users/`, `features/admin-sizes/`, `packages/ui/src/` (`StatTile`, `SegmentedControl`); patterns from `features/clients` and `shared/data-state/DataState.tsx`.

## Verification

- pgTAP `admin-functions.test.sql`: `anon` / `authenticated` cannot execute; non-admin id raises; admin gets rows, stats and detail; no table gives measurements or notes; deleting is untouched.
- API (memory adapters): 401 without token, 403 for a user token, 200 for an admin; search and verified filter; chart `PUT` with impossible values → 422 `SIZE_CHART_INVALID`, valid → saved, one audit row with before/after and `who`, `updated_by` set, warnings returned.
- Unit: CSV export/import round trip, Arabic-Indic digits and decimal comma, BOM; grid dirty/invalid state; `getSessionRole`; access guard for `/admin` in both languages.
- E2E (ar and en projects): signed-out `/admin/users` → sign-in; normal user → 404 page; the seeded `admin@tafsila.test` signs in through the UI (no service-role helper needed in CI), sees stats and the table, searches, opens the size grid, edits a cell (peach), makes one invalid (red, save disabled), fixes, saves, reload keeps it, imports a CSV, exports one; audit row visible in the DB check.
- `pnpm quality`, `pnpm test`, `pnpm api:check`, `pnpm api:test`, `pnpm docs:check`; manual cases in `docs/test-cases/admin/32-mini-admin.md`; screenshots against the AdminUsers / AdminSizes images (ar/en, mobile 390 px, desktop 1280 px).

## After approval (repo steps, not done in plan mode)

Save this plan as `docs/plans/32-mini-admin.md`, post a plan comment on #32, remove `needs:decision` (Merna decided), set `size:L`, keep `status:plan-review` until Merna approves, then `/build #32` runs Part A then Part B.
