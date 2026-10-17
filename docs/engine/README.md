# Engine documentation (`packages/engine`)

Kept current in the same PR as every engine change (Definition of Done). Architecture: `docs/ARCHITECTURE.md` §3. Agent notes: `packages/engine/CLAUDE.md`. Requirements: SRS §4.4 (FR-PAT), §4.5 (FR-VAL), §6.

## Contract

`generatePattern(spec: DesignSpec, measurements: Measurements, options) → PatternResult`

The shapes of `PatternResult` and `EngineOptions` are Zod schemas in `packages/schemas/src/pattern.ts` and `engine-options.ts` ([decision 121](../decisions/121-pattern-contract.md)).

The function is pure and deterministic and runs the same in the browser and on the server. Every result is stamped with `ENGINE_VERSION` (`src/version.ts`), so stored versions re-render identically. Bump it whenever an existing input produces different geometry.

## Pipeline

`generatePattern(spec, measurements, options?, registry?)` lives in `src/pipeline/` ([decision 125](../decisions/125-pipeline.md); pattern: [functional core and plugin pipeline](../handbook/patterns/functional-core-plugin-pipeline.md)). It first checks the input, then runs seven steps. Each step is a pure function `(ctx: DraftContext) => DraftContext` over a frozen context.

| Step          | Does                                                             | Filled by  |
| ------------- | ---------------------------------------------------------------- | ---------- |
| `resolve`     | Drafting inputs from measurements + ease tables (`src/resolve/`) | #126       |
| `blocks`      | Base blocks: bodice, skirt, sleeve                               | #128, #129 |
| `modules`     | Registered `FeatureModule`s transform the blocks                 | real now   |
| `finishing`   | Seam allowance (real now), notches, grain, darts, cut info       | #130, #131 |
| `layout`      | Collision-free label placement                                   | #131       |
| `validate`    | Registered rules → `ValidationReport`                            | real now   |
| `sewingOrder` | Assembly steps for instructions and 3D                           | #146       |

Empty steps are identity functions whose JSDoc names the issue that fills them.

| File                  | Holds                                                                                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `draft-context.ts`    | `DraftContext` (spec, measurements, options, `resolved`, `pieces`, `checks`) `Step`, and `withPiece`/`withPieces`/`withCheck`                                        |
| `feature-module.ts`   | `FeatureModule` and `ValidationRule` interfaces                                                                                                                      |
| `registry.ts`         | `createRegistry`: order by `order` then `id`, duplicate id throws `PIPELINE_DUPLICATE_MODULE`                                                                        |
| `default-registry.ts` | The registry used by default; each real module adds one line                                                                                                         |
| `category-rules.ts`   | Blocks per category (dress: bodice + skirt, skirt, blouse: bodice); bad combination throws `PIPELINE_UNSUPPORTED_COMBINATION`                                        |
| `input-check.ts`      | Schemas + `validateMeasurements`; problems become `fail` checks (`FR-MEAS-01` + `SPEC_INVALID`, `MEAS_INVALID`, `OPTIONS_INVALID` or `MEAS_*`), warnings stay `warn` |
| `input-hash.ts`       | `canonicalJson` and `inputHash` (FNV-1a 64-bit) for `meta.createdFrom`                                                                                               |
| `steps.ts`            | The seven steps and `buildReport` (worst status wins, `pass` when empty)                                                                                             |

Bad input never throws: it returns a `fail` result with no pieces. Only programming errors throw `DraftingError`. `test-support/rectangle-module.ts` is a test-only module (one piece, one `FR-VAL-06` rule).

## Ease tables and resolve (`src/constants/ease.ts`, `src/resolve/`)

`resolveDraftInputs(spec, measurements, { easeProfile })` returns the finished quarter widths (`bustQuarterMm`, `bodiceWaistQuarterMm`, `hipQuarterMm`, `skirtWaistQuarterMm`), sleeve half widths, the style ease per block line, the total ease, pass-through body lengths and `skirtLengthMm`. Blocks never read a body circumference directly for a width ([decision 126](../decisions/126-ease-tables.md)).

**Ease is never added twice.** The tables hold the total ease (what the SRS and FR-VAL-03 talk about). The Aldrich blocks already contain some (`BLOCK_BUILT_IN_EASE_MM`: bust 80, bodice waist 40, skirt hip 40, skirt waist 20, sleeve bicep 50, sleeve wrist 30). Resolve subtracts it and returns the remainder as `styleEaseMm`.

Total ease, mm over the whole circumference (regular is SRS §6.2; the rest are proposals):

| Body line  | fitted | regular | loose |
| ---------- | ------ | ------- | ----- |
| bust       | 60     | 80      | 120   |
| waist      | 20     | 40      | 70    |
| hip        | 30     | 50      | 80    |
| upperArm   | 40     | 50      | 80    |
| acrossBack | 0      | 0       | 20    |

`bodice.fit` modifier on bust, waist and hip (total floored at 0): fitted -10, semi-fitted 0, loose +30. No bodice means 0.

Skirt length: `skirt.lengthMm` wins; otherwise from `waistToKnee` (K) and `waistToFloor` (F): mini K - 180, knee K, midi K + 0.40 (F - K), ankle K + 0.85 (F - K), floor F - 20. Errors: `SKIRT_LENGTH_INVALID_BODY` (F - K below 150), `SKIRT_LENGTH_OUT_OF_BODY` (explicit length below 100 or above F), `FABRIC_NOT_SUPPORTED` (non-woven).

## Geometry kit (`src/geometry/`)

One set of pure 2D helpers; drafting code never writes its own maths ([decision 124](../decisions/124-geometry-kit.md)). Millimetres, x right, y down; angles in radians. Tolerances live in `src/constants/geometry.ts`. Degenerate input throws `DraftingError` with a `GEOMETRY_*` code.

| File               | Helpers                                                                                                                        | For                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `point.ts`         | `pt`, `add`, `sub`, `scale`, `dot`, `cross`, `norm`, `normalize`, `perpendicular`, `lerp`, `angleRad`, `distance`, `samePoint` | vector maths                           |
| `segment.ts`       | `lineSeg`, `cubicSeg`, `mapSegment`, `reverseSegment`, `assertSegment`, `assertPath`                                           | building segments, input checks        |
| `bezier.ts`        | `pointOnCubic`, `tangentOnCubic`, `splitCubic`, `cubicLength`, `tAtLength`, `curveThroughPoints`                               | necklines, armholes, hems              |
| `path.ts`          | `pathLength`, `pointAtLength`, `tangentAtLength`, `splitAtLength`, `subPath`, `reversePath`, `isClosed`, `samplePath`          | seam lengths, notches, edges           |
| `transform.ts`     | `translate`, `rotateAbout`, `mirrorAcross` (points, segments, paths), `rotateSegmentAround`                                    | symmetric halves, dart closing, pivots |
| `intersect.ts`     | `lineLine`, `lineCubic`, `cubicCubic`, `intersectSegments`, `selfIntersections`                                                | construction points, FR-VAL-05         |
| `offset.ts`        | `offsetPath(path, distanceMm or one per segment, { cornerAt })` with mitre or mirrored hem corners                             | seam allowance (FR-PAT-03)             |
| `mirror-corner.ts` | `mirrorHemCorner`: the mirrored hem corner used by `offsetPath`                                                                | hem corners of the cut line            |
| `polygon.ts`       | `signedArea`, `bbox`, `bboxOverlap`, `pointInPolygon`                                                                          | orientation, nesting, inside tests     |
| `roots.ts`         | `solveQuadratic`, `solveCubic`                                                                                                 | intersections                          |

Coverage of the engine must stay at 85% or more (NFR-10): `pnpm --filter @tafsila/engine test` fails below it.

## Seam allowance and the cutting line (`src/finishing/`)

The `finishing` step is an ordered list of sub-steps (`finishingSteps` in `src/finishing/index.ts`); `seamAllowanceStep` runs first ([decision 130](../decisions/130-seam-allowance.md), FR-PAT-03). For every piece it:

1. gives each stitch-path segment the allowance of the edge that covers it (`fromSegment..toSegment`, inclusive): `0` when `edge.kind` is `fold`, else `options.seamAllowance.perEdgeMm["<pieceId>/<edgeId>"]`, else `defaultsMm[edge.kind ?? "other"]` (side 15, neckline 10, armhole 10, hem 30, other 15 mm). Uncovered segments get `other`; two edges on one segment throw `FINISHING_EDGES_OVERLAP`;
2. offsets the stitch path with `offsetPath` (distances negated for a clockwise path) and writes `cutPath` and each edge's `seamAllowanceMm` on a new piece.

**Corner rules**

| Where                                      | Corner                                               |
| ------------------------------------------ | ---------------------------------------------------- |
| A hem meets a seam (not a fold, not a hem) | Mirrored hem corner                                  |
| Everywhere else                            | Mitre, cut square past `MITRE_LIMIT` × allowance     |
| Fold edge                                  | Allowance 0, so the cut line runs on the stitch line |
| Darts                                      | Inside the outline in v1 blocks; no treatment        |

**Mirrored hem corner.** The side cut line runs down to the hem stitch line (P), then continues as its mirror image across that line until it meets the hem cut line (Q). Folded up on the hem stitch line, the hem allowance lies exactly on the side seam allowance, so the seam can be sewn through the turned-up hem. On a square corner P–Q is straight down and Q is the mitre point; on an A-line the hem allowance narrows:

```
        side stitch   side cut
              \        \
               \        \
  hem stitch ---+--------P        <- fold line
                         /
  hem cut  -------------Q         <- mirror of the side cut line, 30 mm below
```

Curved edges use their tangent at the corner (exact for a hem folded on a straight line). Tests: `src/finishing/seam-allowance.test.ts` (distance property ± `SEAM_ALLOWANCE_TOLERANCE_MM` = 0.1 mm, fold, override, orientation, size matrix) and `src/geometry/mirror-corner.test.ts` (hand-computed A-line corner ± 0.05 mm). Print check: `pnpm engine:print seam-rectangle size-m`.

## Rendering and printing a toile (`src/render/`)

`renderSvg(result, { layers, scale })` turns a `PatternResult` into one SVG text; the same result always gives the same bytes ([decision 127](../decisions/127-svg-renderer.md)). Units are mm (`viewBox` and `width`/`height` use the same numbers). Layers, in fixed order: `grid`, `cut`, `stitch`, `notches`, `grain`, `darts`, `labels`, `scale`.

**Print a toile at 1:1:**

1. Run `pnpm engine:print rectangle size-m --out toile.svg` (fixture: `rectangle` or a design fixture such as `vNeckHalfCircleDress`; size: a `SIZE_MATRIX` id such as `size-m`). A design prints only once its garment modules exist; until then the command exits 1 with a message.
2. Open `toile.svg` in Chrome and print with **scale 100% / actual size** (never "fit to page"), or send the file to a plotter print shop.
3. Measure the scale square with a ruler: it must be 100 mm (plus or minus 1 mm). If it is not, the print was scaled; do not cut.
4. If the shop has no Arabic font, open the file in Chrome and print to PDF first.

**Snapshot tests:** `import { expectSvgSnapshot } from "@tafsila/engine/testing"` and `await expectSvgSnapshot(result)` in a test. It writes `__snapshots__/<test name>.svg` next to the test (update with `vitest -u`); open the file in a browser to review it.

## Drafting methods and sources

Each module cites its method in JSDoc. Basis: the blocks follow Winifred Aldrich, _Metric Pattern Cutting for Women's Wear_ (6th ed., metric made-to-measure), written step by step on our measurement fields in [drafting-method.md](drafting-method.md) with reference key points in `@tafsila/test-fixtures` (`referenceDrafts`); FreeSewing (MIT) is only a cited reference for curve construction, not a dependency ([ADR-122](../decisions/122-m2-engine-scope.md), [ADR-122a](../decisions/122a-drafting-system.md)). Add a row here when a module introduces a new method.

| Area     | Method                                                                                                    | Code                                     |
| -------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Bodice   | Aldrich close-fitting block, back and front, bust dart and waist darts; missing lengths from cited ratios | [drafting-method.md](drafting-method.md) |
| Skirt    | Aldrich straight skirt block, front and back, waist darts                                                 | [drafting-method.md](drafting-method.md) |
| Sleeve   | Aldrich one-piece set-in sleeve block (reference points; the cap curve is built by the engine)            | [drafting-method.md](drafting-method.md) |
| Sleeve   | Cap height solved by bisection so the cap exceeds the armhole by the target ease                          | `src/sleeve/sleeve-cap.ts`               |
| Geometry | Gravesen adaptive Bézier length, de Casteljau split, Catmull-Rom curves, Tiller–Hanson offset             | `src/geometry/`                          |

## Module catalogue

Target catalogue: SRS §6.1 (`DesignSpec`). Implemented modules:

| Module id     | DesignSpec path              | Status                                              | Sew-tested |
| ------------- | ---------------------------- | --------------------------------------------------- | ---------- |
| `block-skirt` | `skirt` (any type; the base) | built (#129, `src/blocks/skirt/`, `draftSkirtHalf`) | not yet    |

**Skirt block names** ([decision 129](../decisions/129-skirt-block.md)); #135 to #140 and #143 use the same ones:

| Piece         | Edge    | Kind                                     | Pairs with         |
| ------------- | ------- | ---------------------------------------- | ------------------ |
| `skirt-front` | `waist` | `other`                                  | (waistband, later) |
| `skirt-front` | `side`  | `side`                                   | `skirt-back/side`  |
| `skirt-front` | `hem`   | `hem`                                    | —                  |
| `skirt-front` | `cf`    | `fold`                                   | —                  |
| `skirt-back`  | `waist` | `other`                                  | (waistband, later) |
| `skirt-back`  | `side`  | `side`                                   | `skirt-front/side` |
| `skirt-back`  | `hem`   | `hem`                                    | —                  |
| `skirt-back`  | `cb`    | `fold`, or `other` for a centre-back zip | `skirt-back/cb`    |

The block is drafted at its built-in ease and widened at the side seam by the style ease; the front and back side seams are trued to equal length by moving the waist side points (front down, back up). Errors: `SKIRT_SHORTER_THAN_HIP_DEPTH`, `SKIRT_LENGTH_MISSING`. Print: `pnpm engine:print straightKneeSkirt size-m`.

## Validation rules (SRS §4.5)

| ID        | Check                                      | Tolerance           |
| --------- | ------------------------------------------ | ------------------- |
| FR-VAL-01 | Paired seam lengths match                  | ≤ 2 mm unless eased |
| FR-VAL-02 | Sleeve cap ease (woven set-in)             | 10–40 mm            |
| FR-VAL-03 | Circumference = measurement + ease         | ± 5 mm              |
| FR-VAL-04 | Notches align on paired edges              | ± 2 mm              |
| FR-VAL-05 | Closed outlines, no self-intersection, SA  | exact               |
| FR-VAL-06 | Grain line, name, cut quantity per piece   | present             |
| FR-VAL-07 | Dart legs equal, point within limit        | ± 1 mm              |
| FR-VAL-08 | Plausibility (negative ease, fabric width) | warning             |

## Measurement validation (FR-MEAS-01, -03, -05)

Pure functions in `src/measurements/`, used by the API and the measurements form; the database does not repeat the ranges (ADR-28a).

- `validateMeasurements(m)` returns `{ errors, warnings }`. Each item has a stable `code`, the `fields` involved and `message_ar` / `message_en`. Problems are data, never thrown. Errors block a pattern; warnings never do.
- `fromStandardSize(chart, label, overrides)` returns the chart row with the overrides on top. `undefined` overrides do not erase values; an unknown label throws `UnknownSizeError`. Inputs are not mutated.
- Ranges and ratios are named constants in `src/constants/measurement-ranges.ts`. Outside a range is an **error** (proposal, Merna reviews it):

| Measurement       | Min (mm) | Max (mm) | Why                                        |
| ----------------- | -------- | -------- | ------------------------------------------ |
| height            | 1400     | 2000     | adult women's height                       |
| bust              | 700      | 1500     | smallest adult to plus sizes               |
| highBust          | 650      | 1400     | always a little below bust                 |
| underBust         | 600      | 1300     | below bust                                 |
| waist             | 500      | 1400     | narrow waist to plus sizes                 |
| hip               | 800      | 1700     | smallest adult to plus sizes               |
| hipDepth          | 120      | 280      | waist to hip line                          |
| neck              | 250      | 500      | neck circumference                         |
| shoulderWidth     | 280      | 520      | shoulder point to shoulder point           |
| backLength        | 300      | 550      | nape to waist                              |
| frontLength       | 320      | 600      | shoulder point over bust to waist          |
| bustPointDistance | 120      | 300      | distance between bust points               |
| bustHeight        | 150      | 420      | HPS to bust point                          |
| armLength         | 400      | 750      | shoulder to wrist                          |
| upperArm          | 180      | 500      | upper arm circumference                    |
| wrist             | 110      | 260      | wrist circumference                        |
| waistToKnee       | 400      | 800      | waist to knee, shorter than waist to floor |
| waistToFloor      | 700      | 1300     | waist to floor, skirt and trouser length   |

Cross-checks:

| Code                             | Severity | Rule                                      |
| -------------------------------- | -------- | ----------------------------------------- |
| `MEAS_OUT_OF_RANGE`              | error    | value outside the range above             |
| `MEAS_HIGH_BUST_EXCEEDS_BUST`    | error    | highBust > bust                           |
| `MEAS_UNDER_BUST_NOT_BELOW_BUST` | error    | underBust >= bust (when present)          |
| `MEAS_KNEE_BELOW_FLOOR_LENGTH`   | error    | waistToKnee >= waistToFloor               |
| `MEAS_WAIST_NOT_BELOW_HIP`       | warning  | waist >= hip                              |
| `MEAS_BUST_POINTS_TOO_WIDE`      | warning  | bustPointDistance > bust / 2              |
| `MEAS_FRONT_SHORTER_THAN_BACK`   | warning  | frontLength < backLength                  |
| `MEAS_WAIST_TO_FLOOR_UNUSUAL`    | warning  | waistToFloor outside 50% to 70% of height |

## Units and constants

- Millimetres everywhere; angles in radians. Numeric names end with the unit (`lengthMm`).
- Seam allowance defaults (FR-PAT-03): 15 mm sides, 10 mm necklines and armholes, 30 mm hems.
- Ease tables and other constants live in `src/constants/`, never inline.

## Testing

- Unit tests for key points.
- Property tests (fast-check) for every FR-VAL rule across the size matrix: `SIZE_MATRIX` (5 chart sizes + 20 custom sets) and `arbMeasurements()` in `packages/test-fixtures/src/size-matrix.ts`. Use them, never a private copy. Synthetic sets become `source: "real"` when Merna supplies anonymised sets.
- SVG snapshot per size with `expectSvgSnapshot` (see "Rendering and printing a toile").
- Physical QA: each garment type is sewn as a toile in ≥ 3 sizes (`needs:sew-test`).

## Tutorials and skills

| Task                    | Where                                          |
| ----------------------- | ---------------------------------------------- |
| New garment feature     | `.claude/skills/add-garment-module/SKILL.md`   |
| Step-by-step tutorial   | `docs/backend/tutorials/add-garment-module.md` |
| Path-scoped agent rules | `.claude/rules/engine/drafting.md`             |
