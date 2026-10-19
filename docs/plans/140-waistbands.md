# Plan — #140 waistbands, straight, contour and elastic

Copy of the approved plan comment on issue #140.

## Approach

Generate four waist finishes from the completed skirt waist: straight folded band plus interfacing, contour band/facing traced with darts closed, elastic casing plus computed elastic cut length, or a waist facing for `none`. Every sewn band edge pairs to the skirt top; closure overlap is explicit intended geometry. Add the elastic pass-over-hip plausibility warning.

## Files to create/change

- `packages/engine/src/constants/waistband.ts`: band/casing widths, overlap, elastic ratio and facing depth.
- `packages/engine/src/modules/waistband/{straight,contour,elastic,facing,module}.ts` plus tests/snapshots.
- `packages/schemas/src/pattern.ts` and generated schema/tests only for a minimal optional notion/cut-information entry carrying elastic length; no HTTP/OpenAPI or database migration.
- Registry, module validation/messages, fixture designs.
- `docs/plans/140-waistbands.md`, decision, engine README/test-case/learning-log, snapshots and engine version.

## Test plan

- Unit: each finish, closure overlap, interfacing/facing cut metadata, elastic length ratio and casing width.
- Property: band/facing sewn length equals skirt waist within 2 mm after darts close; contour pieces remain valid; elastic warning fires exactly when the garment cannot pass the hip.
- Snapshot: four finishes over chart sizes and centre-back/side closure variants.
- Manual drafts: `TC-WAIST-140-01` straight band, `-02` contour, `-03` elastic/cut length, `-04` none/facing, `-05` hip warning; retain `needs:sew-test` for a straight band in three sizes.

## Risks and handling

- Contour tracing can retain dart intake or double it: use the shared closed-dart measurement/transform and independently assert final seam length.
- Elastic length is a notion, not a fabric piece: model it explicitly in cut information rather than hiding it in display text.

## Estimate, labels, and decisions

- Change `size:S` to `size:M`; keep `build:opus`. `needs-interactive`: no.
- ADR decisions: contour follows the dart-closed waist; closure overlap is declared, not treated as mismatch; elastic length is typed cut/notion data.
- Comment-only plan per Merna; implementation adds plan/decision files.

## Deviations

- Module files are split by job rather than by finish: `runs.ts` (waist runs in band order), `strip.ts` (straight band, casing, flat facing), `traced.ts` (contour band and waist facing, darts closed by rotation), `finishes.ts`, `rules.ts`, `module.ts`. The sewn-waist measure moved from `modules/skirt/fullness-rule.ts` to `pieces/waist-seam.ts` so the two modules share it without importing each other.
- The contour band rises above the waist seam; the skirt is not lowered (decision 140, 1).
- The hip check also runs when nothing opens (`closure.type: "none"`), not only for elastic (decision 140, 6).
- A contour band on a gathered, pleated or tiered skirt is drafted straight with a warning; `none` on them gives a flat facing strip (decision 140, 4). The module applies to skirts only (decision 140, 5).
- The sew-test (toile in 3 sizes) moved to a follow-up issue per #184.
