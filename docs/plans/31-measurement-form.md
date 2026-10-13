# Plan #31: Measurement form with standard size picker, overrides and illustrated guide

Issue: #31 · plan:sonnet · build:sonnet · size:M → **size:L** (built in two parts) · Milestone: M1 - Accounts & data · Wave 3 · FR-MEAS-01, FR-MEAS-02, FR-MEAS-05 · Design: `Measurements.dc.html`, `Guide.dc.html`

Depends on #28 (validation, `fromStandardSize`, demo chart: merged) and #30 (clients screens: merged, its profile already links to `/clients/[id]/measurements/new` and `/clients/[id]/measurements/[setId]`). The API for sets exists (#29: `POST/GET/PUT/DELETE /api/measurements`). Blocks #34 (exit check).

## What is missing today (found while planning)

1. **No full size chart reaches the app.** The only chart is a seed row (`supabase/seed.sql`, "PLACEHOLDER Egyptian/EU S-XXL") with 4 of the 18 measurements (height, bust, waist, hip), so `fromStandardSize` cannot build a valid set from it, and staging has **no seed at all**, so staging has no chart. A complete demo chart exists only in `packages/test-fixtures` (`demoSizeChart`, S-XXL built from `sizeM`).
2. **No API to read a chart.** RLS already allows reading system charts (`size_charts_read`, `owner_id is null`), but no route returns one.
3. **No place for "which fields were changed".** A set stores `sizeLabel` + the full measurements; the overrides are not stored.

## Split (size L, like #26)

One issue, two PRs ("Part of #31", then "Closes #31"), so each fits one build run (ADR-032):

- **Part A: chart data, API and model.** Data migration with the default chart, `GET /api/size-charts/default`, the feature's `model/` (units, overrides diff, form schema, field groups, guide index) and `hooks/`, with unit and API tests. No screen.
- **Part B: screens, guide, e2e.** The new and edit pages, the form components, the guide dialog with placeholder illustrations, messages, e2e and screenshots.

## Decisions (the build writes them in `docs/decisions/31a-measurement-form.md`)

1. **The default chart comes from a data migration, not the seed.** `supabase/migrations/<ts>_default_size_chart.sql` inserts one system chart (`owner_id null`, `is_default true`, name "PLACEHOLDER S-XXL (demo values, replaced in #32)") with all 18 measurements for S, M, L, XL, XXL, values copied from `demoSizeChart` (a script `scripts/gen-size-chart-sql.mjs` prints the SQL from the fixture so the two never drift; a unit test compares them). The seed's partial chart is removed. Local, CI and staging then have the same chart; #32's editor replaces the values (Merna's real Egyptian chart). **Needs Merna:** staging users will see demo sizes until #32.
2. **`GET /api/size-charts/default`** (behind `requireAuth`, read through `withUser`): `200 { id, name, sizes }` where `sizes` passes `sizeChartSchema`; `404 SIZE_CHART_NOT_FOUND` if none (new catalogue code, bilingual). Cached by the web app for the session (TanStack Query, `staleTime: Infinity`). OpenAPI + Postman regenerated.
3. **Overrides are not stored; they are derived.** When a set has a `sizeLabel`, a field is "changed" when its value differs from that size in the current default chart (`diffFromSize(chart, sizeLabel, measurements) → field[]`, pure, in `model/`). "Reset to size" puts the chart value back. If the chart changes later (#32) old sets may show more changed fields; acceptable before the beta. No schema change.
4. **Units:** users type centimetres with at most one decimal (`92` or `92.5`, Western or Arabic-Indic digits accepted and normalised); the data is whole millimetres (`cmToMm` + round). Reuse `packages/utils` (`cmToMm`, `mmToCm`) and one display helper; #30's local `mmToCm` in `features/clients/model/measurement-summary.ts` is replaced by the shared one (no second copy, rule 3).
5. **Validation in the browser with the engine:** the form runs `validateMeasurements` from `@tafsila/engine` on every change (debounced 200 ms). Errors (`errors[]`) block saving and show red under the fields they name; warnings show amber with the explanation and do not block (as in the design). The API validates again on save (#29), and its `422 MEASUREMENTS_INVALID` details map to the same fields. Messages come from the engine's `message_ar` / `message_en`, picked by locale.
6. **Field groups and order (from the design):** Upper body: bust, highBust, underBust (optional), waist, hip, neck, shoulderWidth, bustPointDistance, bustHeight. Arms (3): armLength, upperArm, wrist. Lengths (6): height, backLength, frontLength, hipDepth, waistToKnee, waistToFloor. Groups after the first are collapsible rows with "3 قياسات من M" as in the design. One typed list `FIELD_GROUPS` in `model/`; a test checks it covers every key of `measurementsSchema` exactly once.
7. **Guide texts live in `messages/{ar,en}.json`** (`measurements.guide.<field>.title|steps|warning`), not in `guide/*.json` as the issue says: ESLint and the parity test already enforce that every user-facing string is in messages (ADR-029). The feature's `guide/` folder holds only the placeholder SVGs and a typed index (`field → svg`). A test fails when a field has no guide entry in either language. **Merna reviews the Arabic guide texts** (M1 brief task). Final illustrations before the beta.
8. **Routes:** `/clients/[id]/measurements/new` (create) and `/clients/[id]/measurements/[setId]` (edit, `PUT`), both under `(dashboard)` (already protected by `/clients`). After save → the client profile with a toast. Another user's client or set → not-found page.
9. **Set label:** required (schema), free text, placeholder from the design ("صيف 2026"); no automatic default.

## Files

### Part A

- `supabase/migrations/<ts>_default_size_chart.sql`, `supabase/seed.sql` (drop the partial chart), `docs/backend/seed-data.md`; `scripts/gen-size-chart-sql.mjs` (+ test against `demoSizeChart`).
- `packages/schemas/src/size-chart.ts`: `sizeChartResponseSchema` `{ id, name, sizes }`.
- `packages/api`: `ports/size-chart-repository.ts`, `adapters/supabase/size-chart-repository.ts` (Drizzle through `withUser`), `adapters/memory/size-chart-repository.ts`, `services/get-default-size-chart.ts`, `routes/size-charts.ts` (+ tests: 200 shape, 404 when none, 401 without token), `domain/errors.ts` + `docs/errors.md` (`SIZE_CHART_NOT_FOUND`), container wiring, `pnpm api:openapi && pnpm api:postman`.
- `apps/web/src/features/measurements/model/`: `field-groups.ts`, `units.ts` (parse typed cm → mm or error key; format mm → cm), `overrides.ts` (`diffFromSize`, `resetField`), `measurement-form.schema.ts` (label + 18 fields as cm strings → `SaveMeasurementSetInput`), `issues.ts` (engine issues → per-field errors/warnings by locale), `guide-index.ts`; all with tests.
- `hooks/`: `query-keys.ts`, `use-default-size-chart.ts`, `use-measurement-set.ts`, `use-save-measurement-set.ts` (create/update, invalidates `["clients"]` and `["measurement-sets", { clientId }]`), `use-measurement-form.ts` (React Hook Form + live engine validation + start mode + reset to size).
- `apps/web/src/features/clients/model/measurement-summary.ts`: use the shared unit helper.

### Part B

- `components/`: `MeasurementForm.tsx`, `StartModeTabs.tsx` (from a size / custom, `Tabs`), `SizePicker.tsx` (chips S-XXL from the chart, hint "يمكن تعديل أي قياس…"), `FieldGroup.tsx` (collapsible), `MeasurementField.tsx` (cm input, "سم" suffix, "معدّل" badge, "العودة إلى قيمة M (74)" link, error/warning line, "كيف أقيس؟" link), `GuideDialog.tsx` (illustration, numbered steps, warning box, "فهمت" / "القياس التالي"), `MeasuringTips.tsx` (the tips card), `SaveBar.tsx` (save disabled with "يوجد خطأ واحد يجب تصحيحه قبل الحفظ"); `index.ts` exports `NewMeasurementSetScreen`, `EditMeasurementSetScreen`.
- `guide/*.svg` (18 placeholder line drawings: a simple body outline with one dashed line per measurement; one shared outline, one overlay each).
- Pages: `app/[locale]/(dashboard)/clients/[id]/measurements/new/page.tsx`, `[setId]/page.tsx`.
- `packages/ui`: only if a needed primitive is missing (segmented tabs and the field "suffix" exist? if not, add with story and test).
- `messages/{ar,en}.json`: `measurements.*` (titles, fields, groups, start mode, guide, save/cancel, toasts, error summary).
- `apps/web/e2e/measurements.spec.ts`; screenshots (ar/en, 390/1280: from a size, custom, with an error and a warning, guide dialog) under `docs/test-cases/ui/screenshots/31/`.

## Test plan

- **Unit:** `units` (`92` → 920, `92.5` → 925, `٩٢٫٥` → 925, `92.55` rejected, `abc` rejected, empty optional underBust → undefined); `FIELD_GROUPS` covers all 18 keys once; `diffFromSize` (no change → [], one changed → [waist], unknown size → all); `issues` maps an engine error naming two fields to both; form schema (label required, required fields, cm limits); guide index and messages have every field in ar and en; size-chart SQL generator equals the fixture.
- **API:** default chart 200 with all sizes valid against `measurementsSchema`; 404 when none; 401 without token.
- **Component:** start mode switch keeps typed values; picking a size fills all fields; editing one shows "معدّل" and the reset link with the chart value; reset restores it; an error disables save and shows the summary line; a warning does not; the guide dialog opens on "كيف أقيس؟" and "القياس التالي" moves to the next field.
- **pgTAP:** the default chart row exists and is readable by `authenticated`.
- **E2E (ar-desktop full, en smoke, mobile one):** sign up → skip verify → add client → new measurements → pick M → change waist (see "معدّل") → save → profile shows the set with size M; custom path with a value that triggers a warning still saves; an impossible value blocks saving; edit the set and reset the field.
- **Manual test cases (draft, `docs/test-cases/ui/31-measurement-form.md`):** TC-UI-31-01 save from size · 02 size + one override · 03 fully custom · 04 error blocks save · 05 warning allows save · 06 reset to size · 07 every guide entry opens (ar/en) · 08 Arabic-Indic digits · 09 decimal 92.5 · 10 edit a saved set · 11 another user's set → not found · 12 mobile RTL layout · 13 English LTR · 14 collapsing groups keeps values · 15 server 422 mapped to the field.

## Risks

- **Size and turns:** two parts; each part keeps checkpoint pushes (ADR-032).
- **Messages file conflicts with #27** (settings) if built in parallel: keys are namespaced (`measurements.*` vs `settings.*`); the second PR merges main first.
- **Placeholder chart on staging** could be mistaken for the real one: the chart name and a small "demo sizes" note under the size picker on non-production environments.
- **Engine in the browser:** `@tafsila/engine` is pure TypeScript and already transpiled by Next (`transpilePackages`); bundle size noted in the PR.

## Merna does

- Approve decisions 1 (default chart by migration, demo values visible on staging until #32), 3 (overrides derived, not stored) and 7 (guide texts in messages, not JSON).
- Review the Arabic guide texts and field names in the Part B PR.

## Labels

`size:M` → `size:L` (two parts). `plan:sonnet`, `build:sonnet` kept. `scripts/needs-interactive.mjs`: no. Status stays `status:plan-review` until Merna approves.

## Build notes (Part B)

Deviations decided while building are in [decision 31b](../decisions/31b-measurement-screens.md): placeholder art is one component plus `guide-marks.json` (not 18 `.svg` files), the start mode uses the existing underline `Tabs`, and a server 422 shows the standard toast.
