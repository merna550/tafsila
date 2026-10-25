## Plan: #284 direct-cut marking steps per piece (engine)

Plan wave M4, 2026-10-25. No dependencies. Feeds #291 (checklist) and #292 (diagram), which only show these steps. Follows ADR-281 item 5 (cut line, fold or grain-parallel reference, curve points every 25 mm).

### Findings that shape the plan

- `cutPath` is an offset of `stitchPath` with extra mitre/hem-corner segments (`geometry/offset.ts`), so cut segments do **not** map 1:1 to `edges` (which index stitch segments). Corners and curves are therefore found on the cut path itself, by tangent breaks, not from edge data.
- A `fold` edge has 0 allowance, so the fold line is the same line on the stitch and cut paths: take it from the stitch-path fold edge (`edgeSegments` in `pieces/measure.ts`).
- Reusable as is: `pointAtLength`, `tangentAtLength`, `pathLength`, `samplePath`, `distancePointToPolyline`, `perpendicular`, `normalize`, `dot` (`geometry/`), `edgeSegments` (`pieces/measure.ts`). No new geometry primitive is needed.

### Approach (`packages/engine/src/cut/`, exported from `src/index.ts`, NOT from `@tafsila/engine/viewer`)

1. **`types.ts`**: the contract below. `CUT_CURVE_STEP_DEFAULT_MM = 25`, `CUT_CURVE_STEP_MIN_MM = 20`, `CUT_CURVE_STEP_MAX_MM = 30`, `CUT_CORNER_ANGLE_DEG = 15` (a tangent break larger than this is a corner; smooth cubic joins are ~0°, mitres ≥ 30°), each with a JSDoc reason.
2. **`frame.ts`**: `cutFrame(piece): CutFrame` and `toFrame(frame, p) / fromFrame(frame, along, across)`.
   - Fold piece (an edge with `kind: "fold"`): reference = the fold edge line (first `from` to last `to`); throws `DraftingError("CUT_FOLD_NOT_STRAIGHT")` if a fold sample is > 0.1 mm off that line.
   - Otherwise: reference direction = the grain line; the line runs through the cut point with the smallest across value (the selvedge side).
   - `along` unit vector points down the sheet (+y; +x when the reference is horizontal), `across` is perpendicular, signed so every cut point has across ≥ 0. Origin = on the reference at the smallest along of the cut line ("top edge" perpendicular). So every distance is ≥ 0.
3. **`runs.ts`**: `cutRuns(cutPath): CutRun[]`: split the closed cut path at corners (tangent break > `CUT_CORNER_ANGLE_DEG`). A run of collinear lines is `straight`; anything else is `curve`. `curvePoints(run, stepMm)`: `n = ceil(length / stepMm)` equal gaps, so a gap is never more than `stepMm` (never under-sampled) and is ≥ `stepMm − 5` once the curve is longer than 5 steps; returns the n − 1 inner points (`pointAtLength`). Straight runs give none.
4. **`steps.ts`**: `pieceCutSteps(piece, stepMm): PieceCutSteps`. Points labelled `A, B, … Z, AA, …` in one sequence per piece. Order:
   1. reference steps: `cut.reference.fold` or `cut.reference.grain`, then `cut.reference.top` (perpendicular through origin);
   2. walk the cut line from the corner nearest the origin, top edge first: per run, `cut.mark.corner` for its start corner, `cut.mark.curve` for each curve point, then `cut.connect.straight` or `cut.connect.curve` to the next corner; the last run closes back to `A`;
   3. notches: the cut-line point nearest the notch on the stitch line (`edgeSegments` + `pointAtLength`), `cut.mark.notch`;
   4. darts: legs and apex (stitch-line positions, marked inside the cut line), `cut.mark.dart` x 3 + `cut.connect.dart`;
   5. grain line: two points + `cut.connect.grain`;
   6. `cut.cut` with `quantity`, `onFold`, `mirror`, `fabric` from `piece.cut`.
      Steps numbered 1..N without gaps.
5. **`index.ts`**: `cutSteps(result: PatternResult, options?: { curveStepMm?: number }): CutSteps`; `curveStepMm` outside 20-30 throws `DraftingError("CUT_STEP_OUT_OF_RANGE")`. Pure and deterministic.
6. **`src/i18n/cut-steps.ts`**: `CUT_STEP_TEXTS: Record<CutStepKey, Bilingual>` templates with `{name}` placeholders, and `cutStepText(step, lang): string`, which fills them and turns `…Mm` params into cm with one decimal, Western digits (NFR-06), e.g. ar "من الطية قيسي 12.5 سم لأسفل و 3.0 سم للداخل وعلّمي النقطة B". Arabic per `docs/design/copy.md`; Merna reviews the texts in the PR.
7. **Error codes** in `errors/drafting-error.ts` if codes are listed there. `ENGINE_VERSION` **not** bumped: `PatternResult` does not change; `CutSteps` carries `engineVersion` so a printed checklist is traceable (ADR-281 item 1).

### Data (plain JSON, crosses the worker boundary; no schema, API or migration change)

```ts
type CutStepKey =
  | "cut.reference.fold"
  | "cut.reference.grain"
  | "cut.reference.top"
  | "cut.mark.corner"
  | "cut.mark.curve"
  | "cut.mark.notch"
  | "cut.mark.dart"
  | "cut.mark.grain"
  | "cut.connect.straight"
  | "cut.connect.curve"
  | "cut.connect.dart"
  | "cut.connect.grain"
  | "cut.cut";
type CutFrame = { kind: "fold" | "grain"; origin: Point; along: Point; across: Point }; // piece mm, unit vectors
type CutPoint = {
  label: string;
  kind: "corner" | "curve" | "notch" | "dart" | "grain";
  at: Point;
  alongMm: number;
  acrossMm: number;
};
type CutStep = {
  n: number;
  key: CutStepKey;
  points: string[];
  params: Readonly<Record<string, string | number>>;
};
type PieceCutSteps = {
  pieceId: string;
  name: Bilingual;
  frame: CutFrame;
  points: CutPoint[];
  steps: CutStep[];
};
type CutSteps = { engineVersion: string; curveStepMm: number; pieces: PieceCutSteps[] };
```

`at` is in piece coordinates so #292 can draw it with the scene offset.

### Tests (`pnpm --filter @tafsila/engine test -- cut`)

- Unit `frame.test.ts`: a rectangle piece with a fold edge on its left → `kind: "fold"`, origin at the fold's top, a corner 200 mm right and 300 mm down reads along 300 / across 200; the same piece without fold, grain vertical → `kind: "grain"`, reference through the leftmost cut point; rotated grain (45°) → all across ≥ 0; a bent fold edge throws `CUT_FOLD_NOT_STRAIGHT`.
- Unit `runs.test.ts`: a rectangle gives 4 straight runs and no curve points; a semicircle of length 157 mm at step 25 gives 7 equal gaps of 22.4 mm; a smooth join of two cubics is not a corner; a 90° mitre is.
- Unit `steps.test.ts`: steps numbered 1..N, no gaps; labels unique, `AA` after `Z`; a piece with 2 notches and 1 dart has 2 `cut.mark.notch` and one `cut.connect.dart`; last step is `cut.cut` with the piece's quantity; `curveStepMm: 19` and `31` throw.
- Unit `i18n/cut-steps.test.ts`: every key has `ar` and `en`; every placeholder in a template exists in the step params the builder emits; 125 mm renders `12.5`; Arabic output uses Western digits only.
- Property `cut-steps.property.test.ts` (fast-check, every catalogue design x `SIZE_MATRIX`, `fc.constantFrom`, as `sewing-order.property.test.ts`; numRuns kept small for speed): every point rebuilt with `fromFrame(along, across)` is within 0.5 mm of the cut line (`distancePointToPolyline` on `samplePath(cutPath)`); straight connections sampled every 5 mm and curve connections (centripetal Catmull-Rom through the run's points, helper in `test-utils/catmull-rom.ts`) stay within 1 mm of the cut line; curve gaps are ≤ `curveStepMm` and ≥ `curveStepMm − 5` on curves longer than 5 steps; straight runs have no curve points; all along/across ≥ 0; steps gap-free.
- Snapshot `cut-steps.snapshot.test.ts`: `cutSteps(seedDress, M)` for its front and back pieces (JSON `toMatchSnapshot`, rounded to 0.1 mm), plus the Arabic text of the first 6 steps of the front for Merna to read in the PR.
- No e2e or visual tests here (no UI; #291/#292). Physical accuracy is Merna's #296.
- Manual case `docs/test-cases/engine/284-cut-steps.md`: TC-ENG-284-01 Merna reads the Arabic step texts of the seed dress front and marks unclear wording; TC-ENG-284-02 measure 3 points of the snapshot on paper with a ruler (sanity before #296).

### Docs

`docs/engine/README.md` new section "Direct-cut steps (`src/cut/`)" (frame, runs, spacing, units, keys), `docs/CONTEXT_MAP.md` row "Direct-cut steps work", JSDoc on every function and type. SRS FR-CUT-01/02 unchanged (behaviour matches). No OpenAPI, Postman or seed change.

### Decisions (build writes `docs/decisions/284-cut-steps.md`)

1. Corners and curves are found on the cut path by tangent breaks over 15°, not from the edge list (cut segments do not map to edges).
2. Curve points are `ceil(length / step)` equal gaps: never more than the step; the "step ± 5 mm" check applies to curves longer than 5 steps (a 30 mm curve at step 25 gets one 15 mm gap pair rather than a missing point).
3. Frame: along points down the piece, across is signed so every distance is ≥ 0; origin on the reference level with the top of the cut line.
4. Point labels are Latin letters (`A`..`Z`, `AA`..) in both languages, the same in the checklist and the diagram; digits Western (NFR-06).
5. Notch points are the nearest cut-line point to the notch; dart points stay on the stitch line (marked inside the cut line).
6. A mirrored or `quantity: 2` piece gets one set of steps for the piece as drafted; `cut.cut` tells the tailor to cut through two layers.
7. `ENGINE_VERSION` is not bumped (no `PatternResult` change); `CutSteps.engineVersion` records it.

### Risks

- Too many steps on long curves (a full circle hem): FR-CUT-02 lets the user pick 30 mm; the count per seed piece is printed in the PR and #296 records unclear steps.
- Catmull-Rom check over 1 mm on tight curves (armhole at 25 mm): if a design fails, lower the test step to the sampled curve and report it in the PR; do not loosen the tolerance silently.
- Corner threshold misclassifies a gentle mitre: unit test on a real mitred hem corner from the seed skirt.
- Property test runtime over the full catalogue: `numRuns` low and one size per design per run; must stay under the engine 30 s timeout.

**Size:** M (unchanged). **Build:** `build:opus` (unchanged: frame orientation and curve splitting are easy to get subtly wrong). `needs-interactive`: no (script says `no`). Status stays `status:plan-review` (plan:opus) until Merna approves; she also reviews the Arabic step texts.

## Deviations

1. **Line kinks are corners** (decision 284 item 1): between two straight lines any turn above 1° is a corner. Under the 15° rule alone, side seams bent 4-10° by a dart were joined with a smooth curve and missed the 1 mm check.
2. **Extra points on tight bends** (decision 284 item 8): equal 25 mm gaps missed rounded collar ends and tight necklines by up to 2.5 mm. The worst gap is now halved until the smooth curve stays within 0.75 mm. The spacing check accepts a gap in the step band or such a gap halved. This is the "do not loosen the tolerance" risk from the plan, solved in the engine rather than in the test.
3. **The smooth-curve model lives in the engine**, not in `test-utils/catmull-rom.ts`: `connectionCurve` reuses `curveThroughPoints` (Catmull-Rom), with ends following the parabola through the first and last three points. The engine uses it to place points, the property test uses it to check, and the diagram (#292) can draw it.
4. **Walk order:** a curve's points and its end corner are marked before the connect step (the plan listed the start corner, the points, then the connection). The tailor can only join points that are already marked.
5. **No connection along the fold** (decision 284 item 9).
6. **Constants** live in `src/constants/cut.ts` (engine rule) rather than `cut/types.ts`. A new helper, `closestPointOnPolyline`, is in `geometry/proximity.ts`.
7. **Texts** have their own subpath, `@tafsila/engine/cut-text` (no geometry), for the main-thread checklist. `cutSteps` is exported from the main entry, as planned. `cut.cut` reuses the piece label wording (`cutInfoText`). The Arabic uses the feminine imperative of the approved DirectCut screen (decision 284 item 10).
8. **Bug found, not fixed here:** on V and sweetheart necklines the cut line crosses the fold by up to 9 mm (#301). The property test allows "across" to go as low as the cut line itself goes.
9. **Snapshot:** JSON of the bodice front and back, a text file of their steps (all, not only the first 6), and the step count of every seed dress piece.
