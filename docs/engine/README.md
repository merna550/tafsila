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
| `resolve`     | Drafting inputs from measurements + ease tables (`src/resolve/`) | real now   |
| `blocks`      | Base blocks: bodice (real now), skirt                            | #128, #129 |
| `modules`     | Registered `FeatureModule`s transform the blocks                 | real now   |
| `finishing`   | Seam allowance (real now), notches, grain, darts, cut info       | #130, #131 |
| `layout`      | Collision-free label placement                                   | #131       |
| `validate`    | Registered rules → `ValidationReport`                            | real now   |
| `sewingOrder` | Assembly steps for instructions and 3D                           | #146       |

Empty steps are identity functions whose JSDoc names the issue that fills them.

| File                  | Holds                                                                                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `draft-context.ts`    | `DraftContext` (spec, measurements, options, `inputs`, `resolved`, `pieces`, `checks`), `Step`, and `withPiece`/`withPieces`/`withCheck`/`withInputs`/`withResolved` |
| `input-errors.ts`     | `INPUT_ERROR_MESSAGES` (ar/en) and `isInputError`: input-type `DraftingError`s (`BODICE_*`, `SKIRT_LENGTH_*`) become a `fail` result                                 |
| `feature-module.ts`   | `FeatureModule` and `ValidationRule` interfaces                                                                                                                      |
| `registry.ts`         | `createRegistry`: order by `order` then `id`, duplicate id throws `PIPELINE_DUPLICATE_MODULE`                                                                        |
| `default-registry.ts` | The registry used by default; each real module adds one line                                                                                                         |
| `category-rules.ts`   | Blocks per category (dress: bodice + skirt, skirt, blouse: bodice); bad combination throws `PIPELINE_UNSUPPORTED_COMBINATION`                                        |
| `input-check.ts`      | Schemas + `validateMeasurements`; problems become `fail` checks (`FR-MEAS-01` + `SPEC_INVALID`, `MEAS_INVALID`, `OPTIONS_INVALID` or `MEAS_*`), warnings stay `warn` |
| `input-hash.ts`       | `canonicalJson` and `inputHash` (FNV-1a 64-bit) for `meta.createdFrom`                                                                                               |
| `steps.ts`            | The seven steps and `buildReport` (worst status wins, `pass` when empty)                                                                                             |

Bad input never throws: it returns a `fail` result with no pieces, including body proportions a block cannot draft (an `FR-MEAS-01` check with the `BODICE_*` or `SKIRT_LENGTH_*` code, [decision 128](../decisions/128-bodice-block.md)). Only programming errors throw `DraftingError`. `test-support/rectangle-module.ts` is a test-only module (one piece, one `FR-VAL-06` rule).

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

## Blocks: bodice (`src/blocks/`)

The `blocks` step folds `BLOCK_DRAFTERS[name]` over `CATEGORY_BLOCKS[category]` (bodice, then skirt for a dress). Blocks are pipeline steps, not `FeatureModule`s; they import `pipeline/draft-context` and `pipeline/category-rules` directly, never `pipeline/index` ([decision 128](../decisions/128-bodice-block.md)).

- `draftBodice(input, options?)` (pure) drafts the back and front halves with the Aldrich method of [drafting-method.md](drafting-method.md). `bodiceBlock` is its step: it reads `ctx.inputs` (throws `PIPELINE_STEP_ORDER` when resolve has not run) and adds the pieces.
- **Pieces:** `bodice-back` (الظهر / Back bodice) and `bodice-front` (الصدر الأمامي / Front bodice), each cut once on the fold.
- **Edges** in path order: `neck` (neckline), `shoulder` (other), `armhole` (armhole), `side` (side), `waist` (other), `cb` / `cf` (fold, no allowance). `shoulder` and `side` pair with the other piece; the back shoulder declares `intendedEaseMm` (`BACK_SHOULDER_EASE_MM`, 0 until the toile).
- **Darts:** `waist-dart` on both pieces (dropped below 6 mm or for `shaping: "none"`), `bust-dart` on the front `side` edge; legs in path order. The front waist dart is trued.
- **`resolved` keys** for the sleeve (#134): `bodice.armholeBackMm`, `bodice.armholeFrontMm`, `bodice.scyeDepthMm`.
- **Input codes:** `BODICE_SHOULDER_INVALID`, `BODICE_LENGTHS_INVALID`, `BODICE_BUST_POINT_OUT_OF_BLOCK` (limits in `src/constants/bodice.ts`); `SLEEVE_CAP_UNSOLVABLE`, `SLEEVE_LENGTH_TOO_SHORT` (`src/constants/sleeve-block.ts`, #134).
- **Shared helpers** for later blocks: `blocks/shared/edges.ts` (`buildEdges`, which sets each edge `kind` and takes its allowance from `allowanceFor` of #130), `blocks/shared/darts.ts` (`trueDartLegs`, `dartMouthIndex`) and `pieces/measure.ts` (`edgeLengthMm` with `closeDarts`, `dartLegLengthsMm`) for #133's rules.
- Seed design: `dartedBlouse` (`pnpm engine:print dartedBlouse size-m`).
- **Shaping (#138):** `bodice.shaping` `darts` keeps the block as drafted; `princess-shoulder`, `princess-armhole` and `none` are modules (`src/modules/bodice/`, order 5, before the sleeve) that replace the block pieces. `armholeParts(pieces)` tells the sleeve which pieces hold each armhole. Seed designs: `princessShoulderBlouse`, `princessArmholeBlouse`, `dartFreeLooseBlouse`.
- **Necklines (#139):** the `neckline` module (order 10, after bodice shaping, before the sleeve) reshapes the neck of whichever piece holds it and adds `neck-facing-front` / `neck-facing-back` and their `-interfacing` pieces. Seed designs: `vNeckBlouse`, `squareNeckBlouse`, `sweetheartNeckBlouse`, `boatNeckBlouse`, `highRoundNeckBlouse`.
- **Collars (#141):** the `collar` module (order 20, after the neckline, before the sleeve) drafts `collar-upper`, `collar-under` and `collar-interfacing` (peter pan), `collar-stand` (cut 2) and `collar-stand-interfacing` (mandarin), or both sets (shirt: stand and fall). The neck edge is split into `neck-back` / `neck-front`, paired with the bodice neck and notched at CB, shoulder and CF; `collarCombinationIssue(spec)` refuses necklines and closures a collar cannot be drafted with. `pieces/neck-seam.ts` (`neckHolders`) is the shared neck lookup. Stand collars replace the neck facings. Seed designs: `peterPanBlouse`, `shirtCollarBlouse`, `mandarinBlouse`.
- **Sleeve styles and cuffs (#142):** the `sleeve/style` module (order 30, beside `sleeve/set-in`) draws cap (`cap-sleeve`), puff, bishop (`sleeve`) and flutter (`flutter-sleeve`) sleeves from the set-in block; the `sleeve/cuff` module (order 31) adds `cuff` + `cuff-interfacing` (+ `cuff-placket` when it opens) or `sleeve-casing` and the `sleeve-elastic` notion. `sleeveCombinationIssue(spec)` refuses type × length × cuff rows not in `SLEEVE_COMBINATIONS`. `pieces/strip.ts` (shared with the waistband) draws the strips. Seed designs: `puffSleeveBlouse`, `bishopSleeveBlouse`, `capSleeveBlouse`, `flutterSleeveBlouse`.
- **Closures (#143):** the `closure` module (order 50, after every module that draws a shell or facing piece) refuses closures not in `CLOSURE_MATRIX` (`closureIssue(spec)`), then: a zip turns the centre folds of the shell and facings into seams (or uses the front side seam), gives every zip seam `ZIP_SEAM_ALLOWANCE_MM` (unless the user set it), adds a paired `zip-stop` notch at the zip length and the `zip` notion; buttons add the `BUTTON_EXTENSION_MM` extension to every piece on the centre line, `button` / `buttonhole` marks (`pieces/button-marks.ts`, shared with the wrist cuff) and a traced `<piece>-facing` + interfacing; `none` adds the FR-VAL-08 hip check. `pieces/closure-opening.ts` (`closureOpensAt`) tells the skirt modules where the closure opens. Seed designs: `centreBackZipDress`, `sideZipDress`, `centreFrontZipDress`, `buttonFrontDress`, `buttonFrontBlouse`, `noClosureDress`.
- **Garment assembly (#144):** `pipeline/category-rules.ts` (`CATEGORY_PARTS`, `checkCategory`) refuses a spec missing a part its category needs and drops ignored parts with a warning. `assembly-waist-seam` (order 45, dress with a waist seam) adds the paired `waist-dart` notches and the `DRESS_WAIST_SEAM_LENGTH` rule; the skirt block centres its dart under the bodice dart (`bodice.waistDart*FromCentreMm`). `assembly-one-piece` (order 45, `waistSeam: false`) rebuilds the bodice pieces to the hem from the skirt rows below the hip (fisheye darts, princess seams to the hem, side seams trued) and removes the skirt pieces ([decision 144](../decisions/144-garment-assembly.md)). Seed designs: `seedDress`, `onePieceDress`, `princessOnePieceDress`, `CATEGORY_SEEDS`.
- **Waistbands (#140):** the `waistband` module (order 40, after every skirt module) adds the skirt's waist finish: `waistband` + `waistband-interfacing` (straight), `waistband-{front,back}` + `-facing-` + `-interfacing-` (contour), `waistband-casing` and the `waist-elastic` notion (elastic), or `waist-facing-{front,back}` + interfacing (`none`; a flat `waist-facing` strip on gathered, pleated and tiered skirts). `pieces/waist-seam.ts` (`closedWaistMm`, `waistPieces`) is the shared sewn-waist measure. Seed designs: `straightBandSkirt`, `contourBandSkirt`, `elasticGatheredSkirt`, `elasticStraightSkirt`.

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

## Marks and labels (`src/finishing/`, `src/layout/`, `src/i18n/pieces.ts`)

Decision: [131](../decisions/131-marks-and-labels.md).

- **Notches.** A module writes a notch on one edge (`edgeId`, `atMm` along the stitch line from the edge start, `pairsWith`). `notchStep` writes the partner on the paired edge at the same distance from the **shared end**: `pairsWith.reversed: true` when the two edges run in opposite directions (partner at `length - atMm`). `marks: 1` (default) is a **single** notch = front; `marks: 2` is a **double** notch = back.
- **Grain line.** `defaultGrainLine(stitchPath, direction)`: centred, parallel to the centre line (vertical in the block frame), 60 % of the height and at least 120 mm. A module may give its own line (bias pieces).
- **Darts.** Recorded as two legs on an edge and an apex inside the piece; the fold direction is always towards the centre line. `dartStep` only validates (legs within 0.1 mm of the edge).
- **Labels.** `layout` writes `name`, `cut` and `size` labels (text from `src/i18n/pieces.ts`: the one catalogue for Arabic and English; the size line also carries the client label and the engine version). The block is placed inside the stitch outline at the largest text size from 8 to 4 mm that fits, 3 mm away from every stitch, cut, grain and dart line (text width is estimated, see decision 131). If it does not fit, it goes just below the piece.
- **Scale square.** One 100 x 100 mm `scale-square` label on the largest piece that holds it; otherwise the sheet draws its own (never both).
- Print check: `pnpm engine:print marks-pair size-m`.

## Rendering and printing a toile (`src/render/`)

`renderSvg(result, { layers, scale })` turns a `PatternResult` into one SVG text; the same result always gives the same bytes ([decision 127](../decisions/127-svg-renderer.md)). Units are mm (`viewBox` and `width`/`height` use the same numbers). Layers, in fixed order: `grid`, `cut`, `stitch`, `notches`, `grain`, `darts`, `labels`, `scale`.

**Print a toile at 1:1:**

1. Run `pnpm engine:print rectangle size-m --out toile.svg` (fixture: `rectangle` or a design fixture such as `vNeckHalfCircleDress`; size: a `SIZE_MATRIX` id such as `size-m`). A design prints only once its garment modules exist; until then the command exits 1 with a message.
2. Open `toile.svg` in Chrome and print with **scale 100% / actual size** (never "fit to page"), or send the file to a plotter print shop.
3. Measure the scale square with a ruler: it must be 100 mm (plus or minus 1 mm). If it is not, the print was scaled; do not cut.
4. If the shop has no Arabic font, open the file in Chrome and print to PDF first.

**Viewer scene (`render/scene.ts`, issue #243):** `buildPatternScene(result)` returns plain, JSON-safe data for the web viewer: the same sheet layout and path data as `renderSvg` (they share the helpers in `layers.ts`), plus per-edge `lengthMm`, notch points and snap points. The browser builds it in the preview worker. `@tafsila/engine/viewer` exports only its types and two small queries, `resolveRef(scene, ref)` (a validation `refs` string to a piece, edge or dart) and `measureBetween(a, b)` (mm), so no drafting code reaches the page bundle.

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

| Module id                  | DesignSpec path                               | Status                                                                                                                                                                                                                                                                                                                                            | Sew-tested |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `block-skirt`              | `skirt` (any type; the base)                  | built (#129, `src/blocks/skirt/`, `draftSkirtHalf`)                                                                                                                                                                                                                                                                                               | not yet    |
| `skirt-circle`             | `skirt.type` `circle-half`, `circle-full`     | built (#136, `src/modules/circle-skirt/`, `draftCircleQuarter`); split to 4 pieces when wider than the fabric; bias hem: hang 24 h, then level ([decision 136](../decisions/136-circle-skirts.md))                                                                                                                                                | not yet    |
| `skirt-straight-a-line`    | `skirt.type` `straight`, `a-line`             | built (#135, `src/modules/skirt/`, `aLinePiece`); A-line closes the waist dart into the hem about a pivot on the hip line; FR-VAL-08 walking-ease warning ([decision 135](../decisions/135-straight-a-line-skirt.md))                                                                                                                             | not yet    |
| `skirt-gathered`           | `skirt.type` `gathered`                       | built (#137, `src/modules/skirt/gathered.ts`); rectangle panels 1.8 × the finished waist, `gather` mark on the waist; FR-VAL-03 closure rule; split into equal panels at the fabric width ([decision 137](../decisions/137-gathered-pleated-tiered.md))                                                                                           | not yet    |
| `skirt-pleated`            | `skirt.type` `pleated`                        | built (#137, `src/modules/skirt/pleated.ts`); 16 knife pleats of 30 mm depth, fold / placement lines and direction arrows as marks; the pleated waist closes to waist + ease                                                                                                                                                                      | not yet    |
| `skirt-tiered`             | `skirt.type` `tiered`                         | built (#137, `src/modules/skirt/tiered.ts`); three tiers, each 1.5 × wider, each tier seam paired with its gathering as intended ease (FR-VAL-01)                                                                                                                                                                                                 | not yet    |
| `skirt-slit`               | `skirt.slit`                                  | built (#135, `src/modules/skirt/slit.ts`, `withSlit`); front, back or side slit with a 40 mm extension and a slit-top notch; FR-VAL-08 fails a slit above the hip line                                                                                                                                                                            | not yet    |
| `bodice/princess-shoulder` | `bodice.shaping` `princess-shoulder`          | built (#138, `src/modules/bodice/`, `frontPrincessPanels` / `backPrincessPanels`); bust dart pivoted into a mid-shoulder style line; four panels with curved seams trued to each other and a bust-level notch ([decision 138](../decisions/138-bodice-shaping.md))                                                                                | not yet    |
| `bodice/princess-armhole`  | `bodice.shaping` `princess-armhole`           | built (#138); as above from 0.35 of the armhole; the sleeve sews to both armhole parts (`armholeParts`)                                                                                                                                                                                                                                           | not yet    |
| `bodice/none`              | `bodice.shaping` `none`                       | built (#138, `src/modules/bodice/dart-free.ts`); no darts, bust dart released as centre-front length ease; FR-VAL-08 warns for a fitted design                                                                                                                                                                                                    | not yet    |
| `neckline`                 | `neckline` (front, back, `depthFrontMm`)      | built (#139, `src/modules/neckline/`, `draftNeck` / `facingPieces`); every catalogue style square to the shoulder, override clamped with an FR-VAL-08 warning, front and back facings 60 mm with interfacing, head-opening check without a neck closure ([decision 139](../decisions/139-necklines-facings.md))                                   | not yet    |
| `collar`                   | `neckline.collar`                             | built (#141, `src/modules/collar/`, `peterPanPieces` / `shirtCollarPieces` / `mandarinPieces`); traced from the finished neck, each neck half paired and notched to the bodice (FR-VAL-01, -04 ± 2 mm), turn of cloth on the under collar, button extension on stands, invalid combinations refused ([decision 141](../decisions/141-collars.md)) | not yet    |
| `waistband`                | `waistband` (skirts)                          | built (#140, `src/modules/waistband/`, `straightBand` / `contourBand` / `elasticCasing` / `tracedFacing`); band runs paired with each skirt waist copy (FR-VAL-01 ± 2 mm), declared closure underlap, contour traced with darts closed, elastic cut length as a notion, FR-VAL-08 hip check ([decision 140](../decisions/140-waistbands.md))      | not yet    |
| `pocket`                   | `pockets` (`side-seam`, `patch`)              | built (#145, `src/modules/pocket/`, order 45); declarative `POCKET_MATRIX`, side-seam bags on notches with rule `POCKET_OPENING_MATCH` (FR-VAL-04), patch pocket with four `pocket-placement` marks; `POCKET_UNSUPPORTED` / `POCKET_NO_ROOM` input errors ([decision 145](../decisions/145-pockets-belt-lining.md))                               | not yet    |
| `belt`                     | `belt` (`self-tie`)                           | built (#145, `src/modules/belt/`, order 46); folded strip across the grain, split at the fabric width into paired parts, rule `BELT_LENGTH` (FR-VAL-01)                                                                                                                                                                                           | not yet    |
| `lining`                   | `lining`                                      | built (#145, `src/modules/lining/`, order 60); `lining-<id>` copies of bodice, skirt and tier pieces with the hem raised 25 mm, rule `LINING_HEM_CLEARANCE`; facing trim and zip opening in #226                                                                                                                                                  | not yet    |
| `sleeve/set-in`            | `sleeve.type` `set-in`, every `sleeve.length` | built (#134, `src/blocks/sleeve/`, `draftSleeve`); cap height solved for 25 mm ease, notches matched from the underarm, adds the bodice armhole notches ([decision 134](../decisions/134-set-in-sleeve.md))                                                                                                                                       | not yet    |

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

| ID        | Check                                      | Tolerance           | Code                                                                                               |
| --------- | ------------------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------- |
| FR-VAL-01 | Paired seam lengths match                  | ≤ 2 mm unless eased | [`validation/rules/seam-match.ts`](../../packages/engine/src/validation/rules/seam-match.ts)       |
| FR-VAL-02 | Sleeve cap ease (woven set-in)             | 10–40 mm            | [`validation/rules/sleeve-cap.ts`](../../packages/engine/src/validation/rules/sleeve-cap.ts)       |
| FR-VAL-03 | Circumference = measurement + ease         | ± 5 mm              | [`validation/rules/circumference.ts`](../../packages/engine/src/validation/rules/circumference.ts) |
| FR-VAL-04 | Notches align on paired edges              | ± 2 mm              | [`validation/rules/notches.ts`](../../packages/engine/src/validation/rules/notches.ts)             |
| FR-VAL-05 | Closed outlines, no self-intersection, SA  | exact               | [`validation/rules/structural.ts`](../../packages/engine/src/validation/rules/structural.ts)       |
| FR-VAL-06 | Grain line, name, cut quantity per piece   | present             | [`validation/rules/labels.ts`](../../packages/engine/src/validation/rules/labels.ts)               |
| FR-VAL-07 | Dart legs equal, point within limit        | ± 1 mm              | [`validation/rules/darts.ts`](../../packages/engine/src/validation/rules/darts.ts)                 |
| FR-VAL-08 | Plausibility (negative ease, fabric width) | warning             | [`validation/rules/plausibility.ts`](../../packages/engine/src/validation/rules/plausibility.ts)   |

Core rules are registered before garment-module rules and sorted by requirement id, then stable failure code. A rule returns one bilingual report row and never edits geometry. To add a rule, add its stable Arabic/English code to [`validation/messages.ts`](../../packages/engine/src/validation/messages.ts), implement and test the pure `ValidationRule`, then register it in [`validation/core-rules.ts`](../../packages/engine/src/validation/core-rules.ts) or in its owning feature module.

Fit rules may return several deterministic rows through `runMany`: one per unique seam pair, declared sleeve cap, garment body line, notch pair or dart. Body lines are measured from stitch geometry; edge-backed lines close dart intake, and fold pieces count twice.

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

## Picker rules

`src/spec-rules/` is what the design picker (M3) reads, so the UI never copies a compatibility rule (issue #238, ADR-238).

- `specRefusals(spec)`: the one list of refused part combinations, built from the modules' own predicates (closure, collar, sleeve, pocket, slit, one-piece dress). The property-test arbitrary uses it too.
- `specOptions(spec)`: per feature (`FEATURE_PATHS`) whether it applies to the category and every schema value as allowed or refused, with the first refusal code and its `{ ar, en }` text. Call it on a normalised design.
- `defaultSpec(category)`: a valid starting design (dress, skirt, blouse).
- `normalizeSpec(spec)`: drops parts the category ignores, adds missing ones, resolves each refusal by changing the add-on that causes it (never the category) and returns `{ spec, changed }`.
- Refusals that depend on the body (pocket room, neckline depth, zip length) are not here; they stay report checks.

## Sewing order (FR-PAT-06)

`generatePattern` ends with `sewingOrder`: numbered steps (`order` 1..n) with `action` (`sew`, `press`, `finish`, `attach`), `edges` and bilingual `text`. Code: `packages/engine/src/sewing/` (decision 146).

- **Phases**, in order: prepare, darts, shoulders, neckline, sleeves, side-seams, waist-seam, closure, waistband, hem, finish. Inside a phase the order is the key order of `SEWING_CATALOGUE`.
- **References:** `piece/edge` (as in FR-VAL-01), `piece/dart:<id>`, or a bare `piece` (fuse interfacing).
- **Where the steps come from:** `rules.ts` maps each seam, by edge ids and the closure, to a catalogue key; it also finds the piece-level jobs. Text lives only in `catalogue.ts`.
- **Coverage rule:** each unique seam (a self pair once) is named by exactly one `sew` or `attach` step. `sewingCoverage(result)` returns `{ ok, uncovered, duplicated }`; the assembler throws `SEWING_PAIR_UNCOVERED` or `SEWING_PAIR_DUPLICATED` otherwise.
- **Add a module with a seam:** give its edges a `pairsWith`, add a rule in `seamKey` (or it falls to `other-seams`) and a catalogue entry with Arabic and English text.

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
