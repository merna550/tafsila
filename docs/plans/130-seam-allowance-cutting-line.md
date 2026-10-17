# Plan #130: seam allowance per edge and the cutting line

Plan comment: <https://github.com/merna550/tafsila/issues/130#issuecomment-6237389754>.

Plan wave M2, 2026-10-17. Depends on #124 and #125, both merged.

**Built 2026-10-17.** Deviations, recorded in [decision 130](../decisions/130-seam-allowance.md): the mirrored corner lives in `geometry/mirror-corner.ts` (not `finishing/hem-corner.ts`) and `cornerAt` returns `"mitre" | "mirror-hem-after" | "mirror-hem-before"` (the hem line is the hem segment's tangent, so there is no `mirrorLine` option); `pnpm engine:print seam-rectangle` prints the pipeline rectangle for the manual check.

## Approach

Fill the pipeline's `finishing` step with a first sub-step, `seamAllowanceStep`. For every piece it works out one allowance per stitch-path segment, offsets the stitch path with `offsetPath`, and writes `cutPath` and `edge.seamAllowanceMm`. It never edits geometry in place and never throws on a piece that is merely unusual: a curve that cannot be offset becomes a `DraftingError` with the existing `GEOMETRY_OFFSET_FAILED` code (a programming or block error, not user input).

## Files to create or change

All under `packages/engine/src/`, with tests next to each file.

- `finishing/seam-allowance.ts`: `allowanceFor(edge, options)` and `seamAllowanceStep`.
  - **Allowance per edge:** `edge.kind === "fold"` → 0; else `options.seamAllowance.perEdgeMm["<pieceId>/<edgeId>"]` if present; else `defaultsMm[edge.kind ?? "other"]`.
  - **Segments to edges:** an edge covers segments `fromSegment..toSegment` (inclusive). A segment not covered by any edge gets the `other` default. Overlapping edges are a block bug: `DraftingError("FINISHING_EDGES_OVERLAP")`.
  - **Orientation:** `offsetPath` moves a path with positive `signedArea` outwards. The step checks `signedArea(samplePath(stitchPath))` and negates the distances for the other orientation (it does not reverse the path, so segment indices stay valid).
  - Writes `cutPath` and returns the piece with each edge's `seamAllowanceMm` filled (edges are copied, never mutated).
- `finishing/hem-corner.ts`: the **mirrored corner** where a `hem` edge meets a non-fold edge. The cut line of the neighbouring edge is continued past the hem stitch line by mirroring it across the hem stitch line, then intersected with the hem's cut line (`mirrorAcross` and `lineLine` with `infinite = true`). Folded up, the hem allowance then lines up with the seam allowance. On a straight skirt with a vertical side and a horizontal hem this equals the mitre; on an A-line it differs, which is the point.
- `geometry/offset.ts` (change): `OffsetOptions` gets `cornerAt?: (index: number) => "mitre" | "mirror"` so the finishing step can ask for the mirrored corner at chosen joints, with the hem line passed in `mirrorLine`. Extra unit tests for it; the default stays mitre, so #124 behaviour is unchanged.
- `finishing/index.ts`: `finishingSteps` is an ordered list; `finishing` = fold of those steps over the context (`#131` appends its steps here). `pipeline/steps.ts` exports `finishing` from it in place of the identity stub.
- `constants/finishing.ts`: `SEAM_ALLOWANCE_TOLERANCE_MM = 0.1` (used by tests), `FOLD_EDGE_KIND = "fold"`.
- `packages/schemas/src/pattern.ts`: `edgeSchema` gets an optional `kind` (`"side" | "neckline" | "armhole" | "hem" | "other" | "fold"`). `engine-options.ts` is unchanged (`EdgeKind` stays the five kinds; `fold` has no default because it is always 0). JSON Schema file regenerated with `pnpm schemas:json`; the existing stale-file test checks it. SRS §6.3 updated. (If #129 is built first it has already added this; reuse it.)
- `pipeline/test-support/rectangle-module.ts` (test only): give the rectangle four edges with kinds so the step has something to measure.

## Data, API, migrations

Schema addition above (optional field, backwards compatible with stored patterns). No database change.

## Tests

- **Distance property (fast-check):** for the rectangle module and, once they exist, the blocks across `SIZE_MATRIX`, the distance from the middle of every cut edge to its stitch edge is the allowance ± 0.1 mm (sampled with `samplePath` and `pointAtLength`).
- **Fold edges:** `kind: "fold"` gives 0 and `cutPath` runs on the stitch line there; hem default is 30 mm, side 15 mm, neckline and armhole 10 mm.
- **Per-edge override:** setting `perEdgeMm["front-panel/side"]` changes only that edge's `seamAllowanceMm` and cut distance (all other edges unchanged).
- **Mirrored hem corner:** an A-line trapezoid fixture: the hem cut corner equals the hand-computed point (± 0.05 mm), and folding the hem up (mirror test) puts the hem allowance edge on the side seam allowance line.
- **Orientation:** a clockwise and an anticlockwise rectangle both grow outwards by the allowance.
- **Closed and simple:** `cutPath` is closed and `selfIntersections` is empty for every piece of the matrix once blocks exist; for now for the fixtures, including a concave one.
- **Purity:** inputs deep-frozen; same input gives deep-equal output.
- **Manual test cases:** `docs/test-cases/engine/130-seam-allowance.md`: print the rectangle with `pnpm engine:print` and measure the allowance with a ruler (side 15 mm, hem 30 mm).

## Decisions

The build writes them as `docs/decisions/130-seam-allowance.md`.

1. **Edge `kind` is a field on `Edge`** (not derived from the id), with `fold` as the "no allowance" marker. It is explicit, survives renaming, and the viewer can colour edges by kind in M3.
2. **`waist` and `cf`/`cb` seams use the `other` default (15 mm).** The method has no separate waist allowance; a waistband seam is 15 mm like a side seam. Change it by one line in `DEFAULT_SEAM_ALLOWANCE_MM` if Merna wants 10 mm.
3. **Corners:** mirrored at hem to side corners, mitre everywhere else (`offsetPath` already limits sharp mitres with a square cut at `MITRE_LIMIT`).
4. **Darts stay inside the outline** in v1 blocks, so they need no allowance treatment. A module that opens a dart into the outline (a slash) owns its corner. This is the reading of "dart ends folded"; recorded here so nobody expects it from this step.
5. **Uncovered segments** get the `other` default quietly; the structural check in #132 reports a piece whose edges list is incomplete.

## Docs

- `docs/engine/README.md`: section "Seam allowance and the cutting line" with the corner rules and a small ASCII diagram of the mirrored hem corner (the issue asks for it).
- SRS §6.3 (`Edge.kind`), JSON Schema regenerated, glossary: "mitre corner", "mirrored hem corner" (skip "mitre corner" if #124 added it).
- Learning-log row.

## Risks

- **Mirrored corner on strongly curved sides** (circle skirts, #136): the reflected line is the tangent at the corner, which is correct for a hem folded on a straight edge and an approximation otherwise. Documented; #136 may override with `cornerAt`.
- **Offsetting a curve tighter than its allowance** fails; blocks never have curves that tight at 15 mm. The error names the piece and edge.
- **#131 and #132 touch `finishing/index.ts` and `steps.ts` too.** The ordered list keeps each change to one line.

## Size

M, as labelled. build:opus (unchanged).
