# Plan #128: bodice block, front and back, with bust and waist darts

Plan comment: <https://github.com/merna550/tafsila/issues/128#issuecomment-6200813308>. Approved by Merna's instruction (2026-10-15); no plan PR.

> Build notes: the neck and the lower armhole (guide point to underarm) are explicit cubics instead of `curveThroughPoints`, because the Catmull-Rom curves dipped below the back nape and the armscye line for some bodies (see decision 128, 5). The front waist dart legs after truing end within 0.1 mm of the same height, not exactly at it.

Plan wave M2 (2026-10-15). Depends on #122 (method and reference drafts), #123 (size matrix), #124 (geometry kit), #125 (pipeline) and #126 (ease and resolve), all merged. It also depends on **#127 (SVG renderer, PR #167)**, but only for the SVG snapshot criterion (see "Order of work").

Sources the builder reads: `docs/engine/drafting-method.md`, `packages/test-fixtures/src/reference-drafts-calc.ts`, `packages/engine/src/pipeline/*`, `packages/engine/src/resolve/*` and `packages/engine/src/geometry/index.ts` (API list only), plus the engine row of `docs/CONTEXT_MAP.md`.

## Approach

The first real block. A pure function `draftBodice(input)` drafts the back and front halves with the Aldrich method of `drafting-method.md`, using the widths from `resolveDraftInputs` (#126). The pipeline gets its first real steps:

- `resolve` calls `resolveDraftInputs`.
- `blocks` drafts the blocks the category needs (`CATEGORY_BLOCKS`): bodice now. The skirt slot stays an identity step until #129.

### Three problems found while planning

The current reference drafts break three acceptance criteria. Each fix is a small, standard drafting step. It is added to the **method and the reference calculation**, the fixture is regenerated, and the engine then matches it to ± 1 mm. Numbers below were computed with a scratch script over the #122 formulas and the whole size matrix.

1. **The shoulder seams do not match.**
   - Both shoulder tips sit at x = SW / 2. Because the front slope (0.40) is steeper than the back slope (0.36), the front shoulder is 1.25 to 2.33 mm **longer** than the back across the matrix.
   - It is over 2 mm for `broad-shoulders` (2.23) and `broad-shoulders-xl` (2.33), so the 2 mm seam property fails.
   - It is also backwards for Aldrich, where the back shoulder is the longer one (eased or darted).
   - **Fix:** the front tip stays at SW / 2. The back shoulder length becomes `front shoulder length + BACK_SHOULDER_EASE_MM`, measured along the back slope, and `BACK_SHOULDER_EASE_MM = 0` for now.
   - The back shoulder edge declares that ease as `pairsWith.intendedEaseMm`. If the toile needs it, Merna sets 5 to 7 mm later; that is one constant and one regeneration.
   - The back tip moves out by about 1.7 mm, and `backWidthPoint.y` follows it.
2. **The bust dart legs are unequal.**
   - Both legs lie on the vertical side seam. If the apex is the bust point, the legs differ by 3.7 mm (S) up to 8.2 mm (`full-figure`), which fails FR-VAL-07 (± 1 mm).
   - **Fix:** add a new key point, `bodice.front.bustDartApex`, at `(BP.x + BUST_DART_APEX_SETBACK_MM, (upper.y + lower.y) / 2)` with the setback = 25 mm.
   - The dart axis is horizontal, so the legs are equal by construction. The apex stays at or beyond the bust point (the FR-VAL-07 limit).
   - The setback also keeps it clear of the front waist dart. Placing the apex 25 mm straight from the BP made the two apexes 2 mm apart at XXL.
   - The reference points of the legs do not change.
3. **The front waist dart legs are unequal.**
   - The legs sit on the sloping front waist line, so they differ by up to 1.93 mm at S and 2.68 mm across the matrix.
   - **Fix (textbook truing):** extend the shorter leg along its own line to the length of the longer one. Both legs then end at the same height, the height of the lower leg.
   - The trued leg moves by up to 1.93 mm (S), so the reference must include this step.

With the three fixes, all acceptance criteria hold across the matrix. Measured with the scratch script:

| Check                                     | Result                    |
| ----------------------------------------- | ------------------------- |
| Side seams (bust dart closed), worst case | 1.47 mm                   |
| Shoulder seams                            | 0 (equal by construction) |
| Waist circumference error, worst case     | 1.73 mm                   |
| Bust circumference on the armscye line    | exactly bust + total ease |
| Dart legs                                 | equal by construction     |

**Proposed new reference values.** Recompute them with the generator; the generator is the source.

| Point                             | S            | M            | XXL          |
| --------------------------------- | ------------ | ------------ | ------------ |
| `bodice.back.shoulderTip`         | 186.6, 42.7  | 194.1, 44.3  | 216.8, 49.2  |
| `bodice.back.backWidthPoint`      | 178.0, 105.1 | 194.2, 109.5 | 242.7, 122.8 |
| `bodice.front.bustDartApex` (new) | 115.0, 262.5 | 120.0, 273.6 | 135.0, 307.0 |
| `bodice.front.waistDartLeft`      | 76.1, 427.3  | 81.2, 438.4  | 96.3, 474.8  |
| `bodice.front.waistDartRight`     | 103.8, 427.3 | 108.8, 438.4 | 123.9, 474.8 |
| derived `backShoulderLength`      | 126.0        | 130.9        | 145.4        |

Every other reference point is unchanged.

## Order of work

1. **Reference first.** Edit `reference-drafts-calc.ts` (3 fixes, 2 new constants), regenerate `reference-drafts.ts` and the tables in `drafting-method.md` (command in that document), and update its step tables. Recompute the changed points of size M in a separate one-off script written from the document (as #122 did) and record the result in the PR description.
2. Constants, the shared helpers (`edges`, `darts`, `measure`), then `draftBodice`, then the pipeline wiring.
3. **SVG snapshots last.** They need `expectSvgSnapshot` from #127 (`@tafsila/engine/testing`).
   - If #127 is not merged yet, rebase onto it once it merges.
   - Do not write a second SVG writer.
   - If #127 is still open when everything else is green, comment on this issue and wait (unattended: `status:blocked`).

## Files

### Reference (`packages/test-fixtures/src/`)

- `reference-drafts-calc.ts` (change):
  - Add `backShoulderEaseMm: 0` and `bustDartApexSetbackMm: 25` to `DRAFT_CONSTANTS`.
  - Back step 3: the shoulder tip is at `neckPoint + (frontShoulderLength + backShoulderEaseMm) * unit(1, backShoulderSlope)`, and its y feeds `backWidthPoint`.
  - Front: add `bodice.front.bustDartApex`.
  - Front step 9: true the waist dart legs (extend the shorter leg).
  - `derived.backShoulderLength` follows.
- `reference-drafts.ts`: regenerated, never edited by hand.
- `reference-drafts.test.ts`: the name list gets `bodice.front.bustDartApex`. Add checks for equal waist-dart and bust-dart legs (± 0.1) and for equal shoulders.
- `designs.ts`: add the seed design `dartedBlouse` (`category: "blouse"`, `bodice: { fit: "semi-fitted", shaping: "darts", waistSeam: false }`, round/round neckline with no collar, `sleeve: { type: "none", length: "short", cuff: "none" }`, closure zip centre-back, no skirt, no pockets, no lining). It is used by the snapshots, the property tests and `pnpm engine:print dartedBlouse size-m`.

### Engine constants and errors

- `packages/engine/src/constants/bodice.ts` (new): every number below, with its unit and reason.
  - Method values: `BACK_NECK_RISE_MM` 20, `SCYE_DEPTH_BASE_MM` 100, `SCYE_DEPTH_BUST_SHARE` 1/8, `BACK_WIDTH_RATIO` 356/880, `CHEST_WIDTH_RATIO` 320/880, `NECK_WIDTH_DEDUCT_MM` 2, `FRONT_NECK_DEPTH_ADD_MM` 10, `BACK_SHOULDER_SLOPE` 0.36, `FRONT_SHOULDER_SLOPE` 0.40, `BUST_DART_RATIO` 25/880, `BODICE_DART_SHARE` 0.5, `BUST_DART_BELOW_UNDERARM_MM` 20, `FRONT_DART_BELOW_BUST_MM` 25, `WIDTH_POINT_DROP_SHARE` 1/3, `BACK_SHOULDER_EASE_MM` 0 and `BUST_DART_APEX_SETBACK_MM` 25.
  - New engine-only values: `MIN_WAIST_DART_MM` 6, `ARMHOLE_BACK_DIAGONAL_MM` 25, `ARMHOLE_FRONT_DIAGONAL_MM` 20, `GRAIN_FROM_CENTRE_MM` 40, `GRAIN_END_INSET_MM` 30, and the proportion limits `MIN_SHOULDER_RUN_MM` 40, `MIN_SIDE_SEAM_MM` 60, `MIN_DART_LENGTH_MM` 60 and `MIN_DART_TO_SIDE_MM` 20.
  - The ease per quarter (20 and 10) is **not** here: it arrives through the resolve widths.
- `packages/engine/src/constants/bodice.test.ts` (new): a sync test. Every method constant equals its `DRAFT_CONSTANTS` twin from `@tafsila/test-fixtures`.
  - The reference calculation is deliberately independent code (#122), so the values are duplicated on purpose. The test stops them drifting.
- `packages/engine/src/errors/drafting-error.ts`: add `BODICE_ERROR_CODES = ["BODICE_SHOULDER_INVALID", "BODICE_LENGTHS_INVALID", "BODICE_BUST_POINT_OUT_OF_BLOCK"] as const`.
- `packages/engine/src/version.ts`: `ENGINE_VERSION` to `0.2.0`. A dress or blouse input now gives pieces.

### Shared helpers (reused by #129, #133, #134, #138)

- `packages/engine/src/blocks/shared/edges.ts` (new):
  - `EdgeSpec` = `{ id, kind: EdgeKind | "fold", segments: number }`.
  - `buildEdges(pieceId, specs, options)` turns consecutive segment counts into `Edge` objects with `fromSegment`/`toSegment` and `seamAllowanceMm`.
  - `seamAllowanceFor(options, pieceId, edgeId, kind)` reads `options.seamAllowance.perEdgeMm["<pieceId>/<edgeId>"]`, then `defaultsMm[kind]`; `"fold"` gives 0.
  - #130 reuses this helper; it does not write its own.
- `packages/engine/src/blocks/shared/darts.ts` (new):
  - `trueDartLegs(apex, legA, legB)`: the shorter leg is extended along its own line to the longer length. It returns new points and never mutates.
  - `dartMouthIndex(path, dart)`: the segment joining the two legs.
- `packages/engine/src/pieces/measure.ts` (new), for #133's rules and this issue's properties:
  - `edgeSegments(piece, edgeId)`.
  - `edgeLengthMm(piece, edgeId, { closeDarts })`: with `closeDarts`, subtracts each dart mouth on that edge.
  - `dartLegLengthsMm(dart)`.
- Tests next to each file (`edges.test.ts`, `darts.test.ts`, `measure.test.ts`).

### Bodice block (`packages/engine/src/blocks/bodice/`)

Each drafting function cites "Aldrich 6th ed., ch. 2, bodice block, step N (docs/engine/drafting-method.md)" in its JSDoc.

- `types.ts`:
  - `BodiceInput`: the body lengths it uses (`neck`, `shoulderWidth`, `backLength`, `frontLength`, `bust` for the ratio lengths, `bustPointDistance`, `bustHeight`) plus `bustQuarterMm`, `bodiceWaistQuarterMm` and `acrossBackStyleEaseMm` from resolve.
  - `BodiceDraft` = `{ back: PieceDraft, front: PieceDraft, keyPoints: Record<BodiceKeyPoint, Point>, armhole: { back: Segment[], front: Segment[], backLengthMm, frontLengthMm }, scyeDepthMm }`.
  - `BodiceKeyPoint` is the union of the reference names.
- `derive.ts`:
  - Derived lengths: scye depth, back and chest widths, neck width, shoulder run, front and back shoulder lengths, bust dart, waist shaping and dart.
  - `checkProportions(...)` throws the `BODICE_*` codes:
    - `BODICE_SHOULDER_INVALID`: run < 40.
    - `BODICE_LENGTHS_INVALID`: back side seam or front side seam below the lower bust dart leg < 60.
    - `BODICE_BUST_POINT_OUT_OF_BLOCK`: BP above the front neck, waist dart shorter than 60, bust dart shorter than 60, or waist dart closer than 20 to the side seam.
  - Back width point x = `(B * BACK_WIDTH_RATIO + acrossBackStyleEaseMm) / 2`.
- `curves.ts`:
  - `neckCurve(centre, neckPoint, shoulderSlope)`: `curveThroughPoints([centre, neckPoint], (1, 0), (slope, -1))`. It is square to the centre line and square to the shoulder.
  - `armholeCurve(tip, widthPoint, underarm, shoulderSlope, diagonalMm)`: through tip, width point, guide point and underarm.
    - The guide point is `corner + diagonalMm * (1, -1) / sqrt 2`, with `corner = (widthPoint.x, underarm.y)`.
    - Start tangent `(-slope, 1)` (square to the shoulder). End tangent `(1, 0)` (square to the side seam).
  - Result: 3 cubics.
- `back.ts`: key points (steps 1 to 8 plus the shoulder fix) and the outline. The outline starts at the nape:
  - neck: 1 cubic, nape to neckPoint.
  - shoulder: 1 line.
  - armhole: 3 cubics.
  - side: 1 line, underarm to sideWaist.
  - waist: sideWaist to dartRight, then the dart mouth, then dartLeft to waistCB (3 lines, or 1 when there is no dart).
  - cb: 1 line, back to the nape.
- `front.ts`: key points (steps 1 to 9 plus the bust dart apex and truing). The outline starts at neckCF:
  - neck: 1 cubic.
  - shoulder: 1 line.
  - armhole: 3 cubics.
  - side: underarm to bustDartUpper, the mouth, bustDartLower to sideWaist (3 lines).
  - waist: sideWaist to the right leg, the mouth, the left leg to waistCF (3 lines, or 1).
  - cf: 1 line.
- Pieces:

  | Piece          | Name (ar / en)                   | Cut                                                            |
  | -------------- | -------------------------------- | -------------------------------------------------------------- |
  | `bodice-back`  | `الظهر` / `Back bodice`          | `{ quantity: 1, onFold: true, mirror: false, fabric: "main" }` |
  | `bodice-front` | `الصدر الأمامي` / `Front bodice` | same as the back                                               |
  - The closure module (#143) turns the CB into a seam later.
  - Edges, in path order:

    | Edge       | Kind       |
    | ---------- | ---------- |
    | `neck`     | `neckline` |
    | `shoulder` | `other`    |
    | `armhole`  | `armhole`  |
    | `side`     | `side`     |
    | `waist`    | `other`    |
    | `cb`/`cf`  | `fold`     |

  - `shoulder` and `side` pair with the other piece. The back shoulder declares `intendedEaseMm: BACK_SHOULDER_EASE_MM`.
  - Darts: `waist-dart` (both pieces) and `bust-dart` (front, on `side`). Legs are in path order.
  - Grain line: parallel to the centre line, `GRAIN_FROM_CENTRE_MM` from it, from `GRAIN_END_INSET_MM` below the neck to the same distance above the waist. #131 may replace it.
  - `notches: []`; notches belong to #131.

- `draft-bodice.ts`:
  - `draftBodice(input): BodiceDraft` (pure).
  - `bodiceBlock: Step` reads `ctx.inputs` and `ctx.measurements`, adds both pieces with `withPiece`, and writes `resolved["bodice.armholeBackMm"]`, `["bodice.armholeFrontMm"]` and `["bodice.scyeDepthMm"]` for the sleeve (#134).
  - No dart, or a waist dart narrower than `MIN_WAIST_DART_MM`: the dart is 0 and the side seam takes all the shaping (`sideX = bodiceWaistQuarterMm`, even when that is wider than the bust quarter).
- `index.ts`.
- `packages/engine/src/blocks/index.ts`: `BLOCK_DRAFTERS: Record<BlockName, Step>` with `bodice: bodiceBlock` and `skirt: (ctx) => ctx` (comment: filled by #129).
- Import rule: blocks import `pipeline/draft-context` and `pipeline/category-rules` directly, never `pipeline/index`, so there is no import cycle with `steps.ts`.

### Pipeline (`packages/engine/src/pipeline/`)

- `draft-context.ts`:
  - Add `readonly inputs: ResolvedDraftInputs | undefined` (undefined in `createContext`) and `withInputs(ctx, inputs)`.
  - `resolved` stays: named numbers in mm passed between steps.
- `steps.ts`:
  - `resolve` becomes `withInputs(ctx, resolveDraftInputs(ctx.spec, ctx.measurements, ctx.options))`.
  - `blocks` folds `BLOCK_DRAFTERS[name]` over `CATEGORY_BLOCKS[ctx.spec.category]`.
  - `bodiceBlock` throws `PIPELINE_STEP_ORDER` when `inputs` is missing. That is a programming error; add the code to the list.
- `input-errors.ts` (new): `INPUT_ERROR_MESSAGES`, a map from code to `{ ar, en }` for `SKIRT_LENGTH_OUT_OF_BODY`, `SKIRT_LENGTH_INVALID_BODY` and the three `BODICE_*` codes, plus `isInputError(e)`.
  - Draft copy (Merna checks):

    | Code                             | Arabic                                                                 | English                                                 |
    | -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------- |
    | `BODICE_SHOULDER_INVALID`        | عرض الكتف صغير جدًا بالنسبة لمقاس الرقبة. راجعي القيم المدخلة.         | Shoulder width is too small for the neck size           |
    | `BODICE_LENGTHS_INVALID`         | طول الظهر أو الأمام قصير جدًا بالنسبة لعمق الإبط. راجعي القيم المدخلة. | Back or front length is too short for the armhole depth |
    | `BODICE_BUST_POINT_OUT_OF_BLOCK` | مكان نقطة الصدر لا يتوافق مع أطوال الجسم. راجعي القيم المدخلة.         | The bust point does not fit these body lengths          |
    | `SKIRT_LENGTH_*` (both)          | طول الجيبة خارج حدود الجسم. راجعي القيم المدخلة.                       | as the code's message                                   |

- `generate-pattern.ts`: run the steps inside one `try`. A `DraftingError` with an input code returns `refusedResult` with one `fail` check `{ id: "FR-MEAS-01", code, message }`. Any other error is re-thrown.
  - This keeps the ADR-125 contract: bad input never throws. Before this change, a skirt `lengthMm` above `waistToFloor` would have thrown once resolve ran.
- `generate-pattern.test.ts`: the dress now gets 2 bodice pieces. Find the rectangle by id instead of counting pieces, and update "empty default registry" to expect `bodice-back` and `bodice-front`. Keep the 5 ms test if it passes; otherwise move that budget to #147 (500 ms) with a note.
- `packages/engine/src/index.ts`: export `blocks` and `pieces/measure`.

## Data, API, migrations

None. There is no schema change: `Edge.pairsWith.intendedEaseMm`, `Dart` and `PieceDraft` already exist. `ResolvedDraftInputs` is an engine type. There is no designs table in `supabase/seed.sql`; the seed design is the `dartedBlouse` fixture.

## Tests

- **Matrix:** `SIZE_MATRIX` (25 bodies) × `easeProfile` (fitted, regular, loose) × `bodice.fit` (fitted, semi-fitted, loose) = 225 cases, run through `fc.constantFrom` so failures shrink to one named case.
- **Tolerances:** from the SRS.

### Unit (`draft-bodice.test.ts`)

1. **Key points.** For S, M and XXL of `egyptianSizeChart`, with regular + semi-fitted, every point of `referenceDrafts[size].bodiceBack` and `.bodiceFront` (26 names: 11 back, 15 front including `bustDartApex`) is within ± 1.0 mm on x and y. Also assert within 0.06 mm, to catch drift early.
2. **The outline passes through the key points.** Each outline key point equals a segment end within 0.01 mm.
3. **Edges.**
   - The ids are exactly `neck, shoulder, armhole, side, waist, cb` (back) or `cf` (front), in order.
   - The edges cover every segment with no gap.
   - `shoulder` and `side` pair with each other; the back shoulder has `intendedEaseMm` 0.
   - The fold edges have SA 0, and `perEdgeMm["bodice-front/side"] = 20` gives 20.
4. **Darts.**
   - S bust dart: legs (240, 250), (240, 275); apex (115, 262.5).
   - S front waist dart: legs (76.1, 427.3), (103.8, 427.3).
5. **Fit variants.** Size M, regular profile, fit fitted / semi-fitted / loose:
   - underarm x = 257.5 / 260 / 267.5;
   - the back waist without the dart = `bodiceWaistQuarterMm` (202.5 / 205 / 212.5).
6. **Small-dart rule.** M with `waist = bust` (the dart would be 5 mm) gives no waist darts, and the side seam waist x = `bodiceWaistQuarterMm`.
7. **Bad proportions.**
   - `draftBodice` with `shoulderWidth` 200 and `neck` 450 throws `BODICE_SHOULDER_INVALID`.
   - `generatePattern(dartedBlouse, { ...M, bustHeight: 420, backLength: 330, frontLength: 340 })` returns `fail` with no pieces and code `BODICE_BUST_POINT_OUT_OF_BLOCK`, and does not throw.
   - A dress with skirt `lengthMm: 2000` gives `fail` with `SKIRT_LENGTH_OUT_OF_BODY`.
8. **Purity.** Deep-frozen inputs do not throw. Two runs give `toEqual` results and identical `JSON.stringify` output.
9. **Pipeline.** `generatePattern(dartedBlouse, sizeM)` passes `patternResultSchema.parse`; the pieces are `bodice-back` and `bodice-front`; `resolved` holds both armhole lengths, both > 0.
10. **Shared helpers.**
    - `trueDartLegs` on a known asymmetric dart: apex (0, 0), legs (-10, 100) and (10, 105) give equal lengths, and the moved leg stays on its line.
    - `edgeLengthMm` with and without `closeDarts` on a hand-built piece.
    - `seamAllowanceFor` checks the precedence (per-edge over default over fold).

### Property (`bodice.property.test.ts`)

- **FR-VAL-01:**
  - `| edgeLength(front, side, closeDarts) - edgeLength(back, side) | <= 2`.
  - `| back shoulder - front shoulder - intendedEase | <= 2`.
- **FR-VAL-03:**
  - `2 * (back.underarm.x + front.underarm.x) = bust + totalEase.bust` ± 5. Bust is measured on the armscye line, where the method sets the bust width.
  - `2 * (back waist + front waist, darts closed) = waist + totalEase.waist` ± 5.
- **FR-VAL-07:**
  - Each dart's legs are equal ± 1.
  - Bust dart `apex.x >= BP.x`; front waist dart `apex.y >= BP.y`.
- **FR-VAL-05 (structural part):** `isClosed`, `selfIntersections(stitchPath)` is empty, and the completed piece passes `pieceSchema`.
- **Darts sit inside the piece:** the two front dart triangles do not overlap, and every apex is inside the outline (`pointInPolygon` on `samplePath`).
- **Curves:**
  - The armhole's sampled y never decreases from the tip to the underarm.
  - Each neck curve stays inside its box (0..neckWidth, 0..depth) ± 0.5 mm.
  - If the neck property fails, build the neck as one explicit cubic with named handle ratios instead of `curveThroughPoints`, and note it in the decision file.
- **Random bodies:** `arbMeasurements()`, 200 runs. `generatePattern(dartedBlouse, m)` never throws. It returns either 2 valid pieces or `fail` with a `BODICE_*` or `MEAS_*` code.

### Visual (`bodice.snapshot.test.ts`)

`expectSvgSnapshot(generatePattern(dartedBlouse, size))` for each chart size: `size-s`, `size-m`, `size-l`, `size-xl`, `size-xxl`. The snapshots are committed under `blocks/bodice/__snapshots__/`.

### Coverage and commands

- Engine coverage stays ≥ 85% (`pnpm --filter @tafsila/engine test:coverage`).
- Node is 22.22.0, so run with `npx` or `pnpm --config.engine-strict=false`.

### Manual test cases (`docs/test-cases/engine/128-bodice-block.md`)

| ID            | Case                                                       | How                                                                                                                                                                             |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-ENG-128-01 | Key points match the reference for S, M and XXL (± 1 mm)   | automated                                                                                                                                                                       |
| TC-ENG-128-02 | Shoulder and side seams match across the matrix (2 mm)     | automated                                                                                                                                                                       |
| TC-ENG-128-03 | Bust and waist circumference = measurement + ease (± 5 mm) | automated                                                                                                                                                                       |
| TC-ENG-128-04 | Dart legs equal (± 1 mm), apexes not past the bust point   | automated                                                                                                                                                                       |
| TC-ENG-128-05 | Bad proportions give a clear `fail`, no crash              | automated                                                                                                                                                                       |
| TC-ENG-128-06 | Visual review of the M snapshot                            | manual: smooth armhole and neck, darts placed sensibly                                                                                                                          |
| TC-ENG-128-07 | The 3 reference changes agree with the book                | manual: Merna, with her 6th-edition copy                                                                                                                                        |
| TC-ENG-128-08 | Toile                                                      | manual: `pnpm engine:print dartedBlouse size-s` (then `size-m`, `size-xxl`), print at 100%, check the 10 cm square, sew, log fit notes in `docs/test-cases/engine/sew-tests.md` |

- Create `docs/test-cases/engine/sew-tests.md` (it does not exist yet). Columns: date, issue, garment, size, fabric, fit notes, action. Add one empty row each for #128 S, M and XXL.
- In `122-drafting-method.md`, update TC-ENG-122-04 to cover the recomputed points.
- Run `scripts/test-case-index.sh`.

## Decisions

The build writes them as `docs/decisions/128-bodice-block.md`. All are cheap to reverse: a constant or a step in the reference calculation, then regenerate.

1. **Equal shoulders.** The back shoulder = front shoulder + `BACK_SHOULDER_EASE_MM` (0), along the back slope; the front tip stays at SW / 2. The ease is declared on the back edge (`intendedEaseMm`), so FR-VAL-01 reads it. The toile decides whether the ease becomes 5 to 7 mm.
2. **Bust dart apex** on the horizontal through the middle of the dart mouth, 25 mm beyond the BP towards the side seam. The legs are equal by construction, and the apex stays clear of the waist dart.
3. **Front waist dart truing:** extend the shorter leg.
4. **The reference changes with the method.** `reference-drafts-calc.ts` and `drafting-method.md` get decisions 1 to 3, and the fixture is regenerated. The engine is never tested against points it cannot meet.
5. **Armhole guide point** on the 45° diagonal from the corner of width point x and armscye line: 25 mm at the back, 20 mm at the front (common block practice; Merna checks the book). The curve is square to the shoulder at the tip and square to the side seam at the underarm.
6. **The bust circumference** for FR-VAL-03 is measured on the armscye line.
7. **A waist dart narrower than 6 mm is dropped.** The side seam takes the shaping, even when it flares out because the waist quarter is wider than the bust quarter.
8. **Bodice pieces are cut on the fold at CF and CB.** The closure module (#143) turns the CB into a seam.
9. **Blocks are a pipeline step, not `FeatureModule`s.** `BLOCK_DRAFTERS` is keyed by `BlockName`. The block does not register FR-VAL rules: #133 builds them with `pieces/measure.ts`, and this issue proves the properties in tests.
10. **Input-type `DraftingError`s become a `fail` result.** These are the skirt length codes and the bodice proportion codes. Programming errors still throw.
11. **`DraftContext.inputs`** holds `ResolvedDraftInputs` (a new field, allowed by plan 125). `resolved` holds the numbers blocks pass on, such as the armhole lengths.
12. **The engine's method constants duplicate `DRAFT_CONSTANTS` on purpose** (an independent reference), with a sync test.

## Docs

- `docs/engine/drafting-method.md`:
  - Back step 3 (shoulder) and front steps 7 (apex) and 9 (truing).
  - The tables, regenerated.
  - "Known limits": the back shoulder ease is 0 until the toile; the armhole does not deepen for loose fits.
  - The checklist: add the 3 changes for Merna to check against the book.
- `docs/engine/README.md`: a "Blocks: bodice" section covering `draftBodice`, the piece ids, edges, darts, `resolved` keys, input codes and the module order. Mark the `blocks` row as filled for the bodice.
- `docs/decisions/128-bodice-block.md` (above).
- `docs/plans/128-bodice-block.md` (this text).
- Handbook glossary: "Dart truing", "Armscye depth" and "High point of shoulder (HPS)", if missing. Add a learning-log row and a "Concepts introduced" section in the PR.
- Test cases as above. No SRS change: the SRS rules are met as written. No OpenAPI, Postman or seed SQL change.

## Risks

- **The reference changes hit #122's "independent" check.** The changed points are recomputed in a separate script (Order of work, step 1), and Merna checks the 3 steps against the book (TC-ENG-128-07).
- **The Catmull-Rom armhole or neck may bulge.** The curve properties catch it. The fallback is explicit cubics with named handle ratios, without changing any key point.
- **#127 is not merged yet.** Only the snapshot step waits; see "Order of work".
- **The pipeline tests change shape** (a dress now has pieces). They are updated in the same PR; the rectangle-module tests find their piece by id.
- **The 225-case property suite takes time.** Plain arithmetic; expect under 5 s. If slower, sample 60 cases with a fixed seed and keep the full run for #147.

## Size and labels

- Size: M is kept. This is upper M, close to L: one block, 3 shared helpers, the pipeline wiring and a reference change.
- `build:opus` (unchanged).
- `needs:interactive`: no (`scripts/needs-interactive.mjs` returned `no`).
- `needs:sew-test` stays until the toiles are logged.
