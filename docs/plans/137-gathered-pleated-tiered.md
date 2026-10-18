# Plan #137: gathered, pleated and tiered skirts

Plan comment on issue #137 (plan wave M2). Depends on #129, #130 and #131, all merged. Physical QA: `needs:sew-test` stays until toiles are sewn in 3 sizes (follow-up issue).

## Approach

Implement gathered, knife-pleated and tiered skirts as separate modules over panel-building helpers. Gathered/tier seams declare their intentional ease, while pleats carry explicit fold lines/directions and close to the resolved waist. Introduce one typed, renderer-supported `Piece.marks` contract for fold/gather/placement marks; #143 should consume this contract instead of defining a second mark format.

## Files to create/change

- `packages/schemas/src/pattern.ts`, generated JSON schema/tests and fixtures: add typed pattern marks (line/arrow/point with stable kind/id and optional bilingual text). No HTTP/OpenAPI or database migration.
- `packages/engine/src/constants/skirt-fullness.ts`: gather ratios, pleat depth/count limits and tier ratios.
- `packages/engine/src/modules/skirt/{panels,gathered,pleated,tiered}.ts` with tests.
- `packages/engine/src/render/`: render marks in deterministic SVG layers; snapshots.
- Registry and module validations for assembled waist, declared ease, width splitting and mark placement.
- `docs/plans/137-gathered-pleated-tiered.md`, decision, engine README/test-case/learning-log, seed fixtures, snapshots and engine version.

## Test plan

- Unit: ratio/width calculations, knife-pleat closure, tier counts, panel split thresholds, stable mark geometry/render order.
- Property: gathered/tiered seams satisfy FR-VAL-01 with declared ease; pleats close to waist plus ease within 5 mm; every mark lies on/in its piece; no over-width piece without a warning.
- Snapshot: each style and chart size, including narrow fabric.
- Manual drafts: `TC-SKIRT-137-01` gathered, `-02` pleated, `-03` tiered, `-04` fold arrows, `-05` narrow-fabric panels; retain `needs:sew-test` for tiered/pleated in three sizes.

## Risks and handling

- Mark-contract overlap with closures: #137 owns the shared schema/renderer; #143 depends on it or rebases onto it.
- Large ratios can explode piece counts: cap valid ranges with named constants and report a stable spec failure/warning.

## Estimate, labels, and decisions

- Change `size:M` to `size:L`; keep `build:opus`. `needs-interactive`: no.
- ADR decisions: typed marks are part of PatternResult; intentional ease is stored on paired edges; panel splitting is deterministic and minimal.
- Comment-only plan per Merna; implementation adds the plan/decision files.

## Deviations

- The marks schema also carries `edgeId` and `lengthMm`, so the waist closure rule reads the gathered and pleated length from the marks instead of a paired waist edge: there is no waistband piece yet (#143), so the waist ease cannot sit on a paired edge. Tier seams carry `intendedEaseMm` as planned.
- The gather ratio uses the medium fabric weight (1.8): `DesignSpec` has no fabric weight field yet; the per-weight table is in place.
- Panel skirts skip the straight block (`isPanelSkirt`), they do not replace its pieces.
- The new `marks` SVG layer adds an empty group to every snapshot, so all existing snapshots were refreshed with `ENGINE_VERSION` 0.7.0.
- Seed data: design fixtures `gatheredKneeSkirt`, `pleatedKneeSkirt`, `tieredMidiSkirt` in `@tafsila/test-fixtures`; no database seed or API change.
- Toile criterion moved to a follow-up issue (rule #184).
- `pnpm engine:print` drafted design fixtures with incomplete options (no fabric width or ease profile), so every design printed "no pieces". It now uses `DEFAULT_ENGINE_OPTIONS` and knows the three panel skirt fixtures, so the sew-test follow-up (#206) can print them; the "no pieces" path is tested with a mocked pipeline.
