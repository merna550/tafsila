# Plan #316: Place the pieces and compute the fabric length

Copy of the approved plan comment (https://github.com/merna550/tafsila/issues/316#issuecomment-6466692699).

plan:opus · build:opus · size M (unchanged) · M5 wave 4 · FR-FAB-02, FR-FAB-03, NFR-02, NFR-08 · ADR-313 items 1 to 3 (bottom-left fill on 3 mm column slices, three piece orders, 2 mm tolerance) · builds on `preparePieces` from #315

### Approach

Add `nest(prepared, options)` and the length rules to `packages/nesting`. The spike's algorithm is rebuilt as production code with tests; no spike code is reused unread.

1. **`nest(prepared: PreparedFabrics, options: FabricOptions): NestResult`**, per fabric kind (main, lining, interfacing):
   - Strip is `usableWidthMm` across (y) and open along x. Columns are 3 mm wide (`SLICE_MM = 3`, a constant with the ADR reference).
   - Each shape becomes per-column covered y-intervals (rasterised from its polygon, deterministic edge rule: a column is covered when its centre line crosses the polygon). Occupancy per strip column is an interval list.
   - Placement: try each allowed turn (0°, and 180° unless nap); for the first column x where the shape fits, take the lowest free y (highest y in a folded layout for ordinary pieces so the fold stays free; fold shapes must have y = 0 at the fold edge, and a 180° turn for a fold shape is a flip along x, ADR-313 item 1).
   - **Piece orders:** by area, by height across the fabric, by length along the grain, all largest first with ties by shape id. Run the three, keep the shortest strip; if equal, the earlier order in that list (deterministic).
   - Returns per kind: `placements[]` `{ shapeId, pieceId, copyIndex, xMm, yMm, rotation: 0 | 180, mirrored }`, `stripLengthMm` (max x extent), `doesNotFit[]` (from #315 plus any shape that cannot be placed), `order` used.
2. **`fabricLength(stripLengthMm, options, rowCount)`** (pure):
   - length = strip + shrinkage (`strip × shrinkagePercent / 100`) + pattern repeat × number of cut-piece rows, then rounded **up** to 0.1 m (`Math.ceil(x / 100) / 10` in metres, with an epsilon guard so exact multiples do not jump by 0.1 m).
   - "Rows": the number of placement columns groups in the strip, counted as the distinct non-overlapping x-bands of the placed shapes (pieces that share an x-band are one row). Documented with a drawing in `docs/engine/nesting.md`; repeat 0 (default) adds nothing.
3. **`fabricResult(pattern, options)`**: `preparePieces` then `nest` then `fabricLength` per kind, returns `{ main, lining, interfacing }` each `{ placements, stripLengthMm, lengthM, doesNotFit }` plus `nestingVersion` (a constant string bumped when the algorithm changes; stored by #317's `fabric_calcs`).
4. **Marker scene** (`buildMarkerScene(prepared, nestResult)`): maps the placements to the engine's `PatternScene`-like structure (pieces with transforms, labels from the piece names, the fold line and selvedge as extra lines) using the engine renderer entry (`@tafsila/engine` render exports), so the viewer, PDF and projector can draw it. No new renderer; it returns data only.
5. **Performance**: a timed benchmark test (`nest.bench.test.ts`) for the 3 slowest ADR-313 cases with a 3 s bound per fabric kind, skipped on CI when `CI` is set and `NESTING_BENCH` is not (flaky timing); the bound is also checked by `pnpm --filter @tafsila/nesting bench` locally.

### Files

Create in `packages/nesting/src/`: `occupancy.ts`, `rasterize.ts`, `place.ts`, `orders.ts`, `nest.ts`, `length.ts`, `fabric-result.ts`, `marker-scene.ts`, `nesting-version.ts`, tests next to each (`nest.property.test.ts`, `nest.regression.test.ts`, `nest.bench.test.ts`, `__snapshots__`), update `index.ts` and `types.ts`.
Also: `packages/nesting/scripts/print.ts` (extend with `nest`), `docs/engine/nesting.md` (placement, rounding, repeat rows, drawings), `docs/decisions/316-nesting-placement.md`, `docs/test-cases/engine/yardage-regression.md` (the recorded lengths for Merna's #322 comparison), glossary and learning log.

No API, table, schema or UI change.

### Test plan

- **Property (fast-check over the 5 fixtures, sizes M and XXL, widths 115 and 140 cm, folded and open; and random rectangles):**
  - no two placed shapes overlap (polygon intersection with 0.5 mm tolerance); every placed shape lies inside `0 ≤ y ≤ usableWidth` and `x ≥ 0`;
  - rotation is 0 or 180; 180 never appears with nap; fold shapes touch y = 0 and stay there after a 180 flip;
  - every shape is either placed or in `doesNotFit`; none is placed twice;
  - the strip length is at least the area bound (total area ÷ usable width) and at most the sum of the shapes' lengths.
- **Unit:**
  - rounding: strip 1230 mm, shrinkage 5 % gives 1291.5 mm then 1.3 m; exactly 1000 mm with 0 % gives 1.0 m (not 1.1); shrinkage plus repeat 200 mm × 2 rows is added before rounding;
  - three simple rectangles on a 1000 mm strip: placements equal hand-computed positions;
  - a shape wider than the strip lands in `doesNotFit`; nap forbids 180.
- **Determinism / snapshot:** two runs equal; shuffling the shape order gives the same result (orders sort by id); snapshot of the placements for `dartedBlouse` M 140 folded.
- **Regression (recorded lengths):** main/lining/interfacing strip lengths for the 5 fixtures in the test file, matching the ADR-313 table within ±1 cm (they were measured with the same algorithm); a change must be deliberate.
- **Marker scene:** one unit test that every placement has a scene piece and the scene bbox fits the strip.
- Manual test cases (draft): TC-FAB-316-01 Merna compares the printed layout of `seedDress` M 140 cm folded with how she would lay it; 02 `print nest linedSidePocketDress` lists main and lining lengths; 03 the recorded-lengths file is the input of her #322 check.

### Decisions to log (`docs/decisions/316-nesting-placement.md`)

1. Pattern repeat is added once per row (x-band of shapes), counted as defined above; documented because tailors differ.
2. Rounding up with an epsilon guard of 0.01 mm.
3. `nestingVersion` constant and when to bump it.
4. The marker scene is data only, reusing the engine renderer types.
5. The benchmark is skipped on CI unless asked.

None is costly to reverse; no `needs:decision`.

### Risks

- **Folded edge cases** (curved fold pieces, 180° flips): property tests include fold shapes at both orientations.
- **Speed on circle skirts:** 3 mm slices keep ADR-313's slowest case under 3 s; the bench test guards regressions.
- **Rasterisation vs. true polygon overlap:** the property test checks real polygon intersection, not slices, so a slice rounding error would be caught.
- **Quality vs. a tailor:** waste of 7 to 47 % over the area bound (ADR-313); the bar is Merna's #322 (±10 cm).

### Labels and needs

Size M, `plan:opus`, `build:opus` stay. `needs-interactive` on `packages/nesting/src/nest.ts` and friends: `no`.

## Deviations

1. **Column coverage.** The plan's edge rule ("a column is covered when its centre line crosses the polygon") lets a sloped edge poke into a neighbour by up to half a column, which the 0.5 mm overlap property would catch. A column instead covers every y the outline reaches anywhere inside it, computed exactly per trapezoid between corners (decision 316 item 5).
2. **Recorded lengths vs. ADR-313.** Because of item 1 and tie rules the spike did not record, the recorded strips are not all within ±1 cm of the ADR-313 table (most are within 5 cm; the largest gap is +17 cm on the straight-skirt dress XXL 140 cm folded). The regression test pins this implementation's own numbers within 1 mm; the comparison with the spike is in decision 316 and the bar stays #322.
3. **`nest(prepared)`** takes no options: the layout, usable width and allowed turns are already in the preparation. `fabricResult(pattern, options)` passes shrinkage and repeat to `fabricLengthM`. It also returns `prepared` (the marker scene needs the shapes) and each kind carries `kind` and `rows`.
4. **Marker scene** is `buildMarkerScene(pattern, prepared, kindResult)`: the pattern gives the piece names for the labels. It does not import the engine renderer (the `nesting-is-pure` rule allows only `@tafsila/engine/geometry`); it returns path data in the same format and a structure like `PatternScene` (decision 316 item 4).
5. **`DoesNotFit` carries `fabric`**, so each kind lists its own too-wide pieces.
6. **Rows** counts touching bands as separate rows (only overlapping bands join).
7. **Benchmark** times all three kinds together against one kind's 3 s budget, which is stricter.
8. **Snapshot** is the placements of `dartedBlouse` M 140 cm folded in `fabric-result.test.ts`; the strip lengths of the five fixtures are in `nest.regression.test.ts`.
