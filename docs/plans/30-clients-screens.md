# Plan #30: Clients list and client profile screens

Issue: #30 · plan:sonnet · build:sonnet · size:S → **size:M** · Milestone: M1 - Accounts & data · FR-MEAS-04 · Design: `Clients.dc.html`, `ClientsEmpty.dc.html`, `ClientProfile.dc.html`

Depends on #29 (merged, PR #105: the `/api/clients` and `/api/measurements` routes exist) and #25 (merged: session, guard, auth screens). Blocks #31 (measurement form lives under a client), #33 (generators are extracted from this first real feature) and #34.

## Why the size goes from S to M

The screens are straightforward, but three things the issue did not list are needed: the signed-in navigation bar (no screen has one yet), a small API change so the list can show "size · last edit" without one call per client, and the first real use of `DataState`, TanStack Query hooks and a typed list/detail feature. One PR, built in this order so each commit is green: (1) API summary fields, (2) feature + routes, (3) docs and screenshots.

## Approach

Feature-sliced (ADR-029), exactly the four layers of the `add-page` skill, in `apps/web/src/features/clients/`. Data comes only through `shared/api` (`apiRequest` + schemas from `@tafsila/schemas`), wrapped in TanStack Query hooks. The pages under `app/[locale]/(dashboard)/` stay thin.

- `/clients` (design `Clients` / `ClientsEmpty`): heading with count, "عميلة جديدة" button, debounced name search (`q`, 300 ms, resets `offset`), list of rows (initial avatar, name, one meta line, chevron), "load more" paging by `limit`/`offset` (ADR-29a; no infinite scroll library). Empty list with no search → `EmptyState` with "إضافة أول عميلة". Empty result for a search → `EmptyState` "لا توجد نتائج" with a clear-search action. Loading → `Skeleton` rows; error → `ErrorState` with retry, through `DataState`.
- `/clients/[id]` (design `ClientProfile`): breadcrumb, side card (initial, name, "عميلة منذ مارس 2026", notes, edit and delete buttons), measurement sets section (count, "مقاسات جديدة" link, the newest set expanded with six key values, older sets as link rows). `404` from the API → the standard not-found page (another user's client looks the same, rule `api-design`).
- Create and edit use **one `Dialog`** (`ClientFormDialog`: name required, notes optional) with React Hook Form + Zod from `createClientInputSchema` / `updateClientInputSchema`. After create the app opens `/clients/[id]`. Delete uses a confirmation `Dialog` that names the client and says her measurements go with her; success → back to `/clients` with a toast.
- Signed-in navigation: `features/app-nav` is **not** created; instead `shared/layout/AppNav.tsx` (header bar from the design: logo, links, avatar initial) is rendered by `(dashboard)/layout.tsx`. Items are a typed list; this issue ships "العميلات" and a "الإعدادات" item that is added by #27 (see Overlaps). The "3 باترونات مجانية" chip in the design is **not built** (credits arrive in M7); a code comment points at M7.

## Decisions (the build writes them in `docs/decisions/30a-clients-screens.md`)

1. **The list needs per-client measurement info, so `Client` gains a `summary` object** `{ measurementSetCount, latestSizeLabel | null, lastMeasurementAt | null }` returned by `GET /api/clients` and `GET /api/clients/{id}`. Computed in the repository with one aggregate query (left join on `measurement_sets`, grouped), never in the web app. Recommended over (a) one `GET /api/measurements?clientId` per row (N+1 on every search keystroke) and (b) showing only the name (the design shows the meta line). Additive change: no client breaks, Postman and OpenAPI regenerated.
2. **Meta line = `size label · relative time`, without "with two overrides".** The design's "مقاس M مع تعديلين" needs the number of overridden fields, which is not stored (only `sizeLabel`). Storing overrides is #31's business (it owns the form); this issue shows "مقاس M · آخر تعديل أمس", "مقاسات مخصّصة · قبل 3 أيام" (no `sizeLabel`), "لا توجد مقاسات بعد". #31 may extend the line later. Cheap to change.
3. **Create/edit in a dialog, not a separate page.** The design links "عميلة جديدة" to the profile layout; two fields do not need a page, and the dialog keeps the list context. If Merna prefers a page, only `ClientFormDialog` moves.
4. **Relative time and dates in `model/`** with `Intl.RelativeTimeFormat` and `Intl.DateTimeFormat` (locale from next-intl, `numberingSystem: "latn"` so digits stay 0-9 as the designs show). One pure helper `formatRelativeTime(date, now, locale)` with the clock passed in (testable, no `Date.now()` inside).
5. **Query keys and cache:** `["clients", { q, limit }]` for lists, `["clients", id]` for one client, `["measurement-sets", { clientId }]` for the profile. Mutations invalidate `["clients"]`. `staleTime` 30 s. This is the first TanStack Query use after the spike, so the keys and the hook shapes are written into `docs/frontend/README.md` (state section) as the pattern for later features.
6. **Route protection:** `/clients` is added to `PROTECTED_PREFIXES` in `shared/auth/access-guard.ts` (+ test). `(dashboard)/layout.tsx` currently redirects with a fixed `next=/dashboard`; it is changed to keep the requested path, so a signed-out visitor of `/clients/abc` returns there after sign-in.
7. **The measurement links point at routes owned by #31** (`/clients/[id]/measurements/new` and `/clients/[id]/measurements/[setId]`). Until #31 merges they open the not-found page; the PR description says so. No placeholder pages are built.

## Files to create or change

API and schemas (first commit):

- `packages/schemas/src/clients.ts` (+ `clients.test.ts`): `clientSummarySchema`; `clientSchema` gains `summary`. `.meta({ example })` with a seeded client.
- `packages/api/src/ports/client-repository.ts`: `Client` carries `summary`; no new method.
- `packages/api/src/adapters/supabase/client-repository.ts` (+ `schema.ts` if a count helper is needed): one aggregate query for list and get. `adapters/memory/client-repository.ts`: same summary computed from the memory store.
- `packages/api/src/services/*.test.ts`, `routes/clients-measurements.test.ts`: summary present on list/get, correct after a set is saved or deleted, absent sets give `0/null/null`, another user's data never counted.
- `pnpm api:openapi && pnpm api:postman`; Postman example bodies include `summary`; `pnpm api:test` green.
- `supabase/seed.sql` already has clients and sets; check that the seeded client with sets and the one without both exist (`docs/backend/seed-data.md` updated if one is added).

Web:

- `apps/web/src/features/clients/model/`: `client-view.ts` (`toClientRow`, `toClientProfileView`), `format-relative-time.ts` (+ tests), `client-form.schema.ts` (re-exports the API schemas for RHF; error keys as message ids), `measurement-summary.ts` (the six key values: bust, waist, hip, shoulderWidth, backLength, height, mm → cm with one decimal rule from `docs/design/copy.md`).
- `hooks/`: `use-clients.ts` (list with `q`/paging), `use-client.ts`, `use-client-measurement-sets.ts`, `use-create-client.ts`, `use-update-client.ts`, `use-delete-client.ts`, `use-debounced-value.ts`. Errors go through `useApiErrorHandler`; field errors under the field.
- `components/`: `ClientsList.tsx`, `ClientRow.tsx`, `ClientSearch.tsx`, `ClientsEmptyState.tsx`, `ClientProfileCard.tsx`, `MeasurementSetsSection.tsx`, `MeasurementSetCard.tsx`, `ClientFormDialog.tsx`, `DeleteClientDialog.tsx`; `index.ts` exports `ClientsScreen` and `ClientProfileScreen` only.
- `apps/web/src/app/[locale]/(dashboard)/clients/page.tsx` and `clients/[id]/page.tsx` (thin), `clients/[id]/not-found.tsx` if the shared one does not fit.
- `apps/web/src/shared/layout/AppNav.tsx` (+ test): links, `aria-current`, avatar initial from the session user; `(dashboard)/layout.tsx` renders it; mobile: links wrap under the logo as in the design (no hamburger).
- `apps/web/src/shared/auth/access-guard.ts` (+ test): `/clients`.
- `apps/web/messages/{ar,en}.json`: `clients.*` (titles, search, meta line forms with ICU plurals, empty states, dialog texts, delete confirmation), `nav.*`; measurement names used on the card go under `measurements.fields.*` (see Overlaps). `docs/design/copy.md` glossary: "measurement set / مجموعة مقاسات" if missing.
- `packages/ui`: only if a needed component is missing (the design needs avatar-with-initial, list row, breadcrumb). `Avatar` exists; if no `Breadcrumb` exists, add one with story and test, not inline styling.

## Test plan

- **Unit (Vitest):** `formatRelativeTime` (just now, minutes, yesterday, 3 days, 2 weeks, months; ar and en; fixed `now`); `toClientRow` for the three meta forms; `measurement-summary` (mm to cm, missing optional value); `client-form.schema` (empty name, 121-character name, notes 2001 characters, trimmed name); `access-guard` for `/clients` and `/en/clients/abc` signed out → `/sign-in?next=…`; `AppNav` marks the active link.
- **Component tests (Testing Library, `shared/i18n/testing.tsx`):** list renders rows and the count; loading skeleton; error state with retry calls refetch; empty (no search) shows "إضافة أول عميلة"; empty search result shows the clear action; typing in search debounces and requests `q`; create dialog validates and shows the API field error under the name; edit prefilled; delete dialog names the client and confirms; profile with 0, 1 and 2 sets; messages parity (ar and en have the same keys, existing test).
- **API (Vitest, memory adapters + routes):** as listed under "API and schemas"; permission test: user B's list and get never include or count user A's sets (404 for A's client id).
- **E2E (Playwright, local Supabase, ar and en projects):** sign in as the seeded user → empty-state account shows "لا توجد عميلات بعد" → add client "سلمى عادل" with notes → lands on the profile → search finds her, a wrong word shows "لا توجد نتائج" → edit the name → delete with confirmation → back on the empty list. A second seeded user cannot open the first user's client URL (not-found page). The measurement save part belongs to #31's e2e. Uses `appAlert`/exact-text helpers from `e2e/auth.spec.ts` lessons (#111): toast text matched with `exact: true`.
- **Visual:** PR screenshots of list, empty, profile, create dialog, delete dialog in ar/en, mobile 390 px and desktop 1280 px, compared with the images in `docs/design/screens/images/`; Storybook stories for any new `packages/ui` component.
- **Manual test cases (draft, `docs/test-cases/ui/30-clients-screens.md`):** TC-UI-30-01 empty list first visit · 02 add a client (name only) · 03 add with notes · 04 name required error · 05 search finds by part of the name · 06 search without result · 07 open profile from the list · 08 edit name and notes · 09 delete confirmation (cancel keeps, confirm removes with its sets) · 10 another user's client URL → not found · 11 list with 25+ clients, "load more" · 12 meta line forms (size, custom, none) · 13 English mode mirrored layout · 14 mobile 390 px · 15 signed-out visit of `/clients` returns after sign-in · 16 measurement links (404 until #31) · 17 slow network shows skeleton, offline shows the connection banner.

## Docs to update

`docs/test-cases/ui/30-clients-screens.md`; `docs/decisions/30a-clients-screens.md`; SRS FR-MEAS-04 status; OpenAPI + Postman (generated); `docs/frontend/README.md` (Query keys, the list/detail hook pattern, `AppNav`); `docs/design/screens/README.md` rows (#30 routes confirmed, "chip not built"); `.claude/skills/add-page/SKILL.md` updated from this first real feature (the issue asks for it: real file names, the dialog form pattern, the debounce hook); `docs/handbook/learning-log.md` (TanStack Query keys, debounced search, relative time with `Intl`); `docs/handbook/tech/` card for TanStack Query if missing; `docs/backend/seed-data.md` only if the seed changes; `docs/milestones/M1-accounts-and-data.md` (nav bar added).

## Risks

- **#31 overlap on messages and routes:** both touch `messages/{ar,en}.json` and the `/clients/[id]` subtree. Keys are namespaced (`clients.*` here, `measurements.*` in #31) so merges conflict only in the file tail; #30 merges first (#31 depends on it).
- **Aggregate query cost:** one grouped query per page of 20 clients; indexed on `measurement_sets (client_id)` (already created in #24). Checked with the memory/real adapter test and `explain` noted in the PR if slow on 1,000 seeded clients.
- **Arabic copy** is taken from the design files; Merna reviews texts not in the design (search-without-result, delete confirmation, error texts) in the PR.
- **RTL details:** chevrons flip, initials avatar for Arabic names uses the first letter of the first word; Latin names get an uppercase initial. Tested with both.
- **`DataState` is new in real use:** if it lacks an option the list needs (keep previous data while searching), add `placeholderData: keepPreviousData` in the hook, not a change to `DataState`.

## Merna does

Review the Arabic texts that are not in the design, and approve decisions 1 to 3 (summary fields, no "overrides" count yet, dialog instead of a page).

## Labels

`size:S` → `size:M`. `plan:sonnet`, `build:sonnet` kept (existing patterns, no security-sensitive change). `scripts/needs-interactive.mjs` on the files above: `no`. Status stays `status:plan-review` until Merna approves.
