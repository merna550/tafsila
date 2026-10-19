# Plan — #139 necklines (front and back styles, depth override) with facings

Copy of the approved plan comment on issue #139.

## Approach

Replace the base front/back neckline sections with catalogue-specific curves, respecting shoulder endpoints and a right-angle join. Resolve named default width/depth constants, apply `depthFrontMm` within body/geometry limits, clamp out-of-range requests with a bilingual warning, and trace matching 60 mm front/back facings plus interfacing pieces. Add the no-closure head-opening plausibility warning.

## Files to create/change

- `packages/engine/src/constants/neckline.ts`: per-style dimensions, facing width, clamp/head-opening constants.
- `packages/engine/src/modules/neckline/{resolve,curves,facing,module}.ts` and tests/snapshots.
- Reusable path tracing/offset helpers in geometry only when existing helpers cannot express the facing safely.
- Registry, module validations and bilingual messages.
- Seed fixtures, `docs/plans/139-necklines-facings.md`, decision, engine README/test-case/learning-log, snapshots and engine version.

No database, migration, HTTP/OpenAPI, or public schema change is expected.

## Test plan

- Unit: every front/back style, exact override/clamp boundaries, shoulder tangent, facing piece/cut metadata and paired neckline edges.
- Property: every front × back combination across the size matrix has closed/non-self-intersecting pieces; facing neck edge differs by at most 2 mm; no-closure warning is deterministic.
- Snapshot: each style and representative combinations/sizes.
- Manual drafts: `TC-NECK-139-01` round, `-02` V, `-03` square/sweetheart, `-04` boat/high-round, `-05` override clamp, `-06` facing/interfacing; retain `needs:sew-test` for three necklines in three sizes.

## Risks and handling

- Tight concave offsets can self-intersect: trace the inner neckline and construct the facing outer boundary with bounded offsets plus structural validation.
- Front/back combinations can kink at shoulders: enforce endpoint tangent and test the sewn join.

## Estimate, labels, and decisions

- Size `M`, `build:opus`; `needs-interactive`: no.
- ADR decisions: override is clamped with warning; facings are separate main/interfacing pieces; neckline geometry owns the sewn edge and later collar work (#141) reads it.
- Comment-only plan per Merna; implementation adds plan/decision files.

## Deviations

- Files: the module is `src/modules/neckline/{resolve,curves,draft-neck,splice,facing,rules,module}.ts`; `draft-neck.ts` (block neck, resolution, new necks) and `splice.ts` (putting a neck into a block half or a princess centre panel) were split out of `module.ts` to keep functions small. No geometry helper was added: the facing uses `offsetPath` and `arcToCubics`.
- Depth is measured from the level of the moved neck point, not from the HPS, so a widened neck keeps its depth and its curve stays smooth (decision 139, 1).
- The round family uses its own cubic (handles adapted to depth/width) instead of the block's `neckCurve`, and the sweetheart is built from circular arcs: the block curve and a cubic sweetheart looped in the seam allowance or the facing offset on some bodies (decision 139, 3).
- The head-opening check also runs for a side zip (nothing opens at the neck) (decision 139, 5).
- Toile criterion moved to the sew-test follow-up issue (#184 rule).
