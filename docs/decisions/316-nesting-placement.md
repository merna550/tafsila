# ADR-316 · 2026-10-28 · Nesting placement and length rules

## Context

`packages/nesting` (#316) places the prepared shapes on the fabric strip and returns the length to buy (FR-FAB-02, FR-FAB-03, NFR-02, NFR-08). [ADR-313](313-nesting-algorithm.md) fixes the algorithm (bottom-left fill on 3 mm column slices, three piece orders) and [decision 315](315-nesting-preparation.md) the shapes. A few details were still open: how a pattern repeat is counted, how the rounding treats exact steps, when the algorithm version changes, what the marker scene is, how a column covers a shape, and when the timing test runs.

## Decision

1. **Pattern repeat, once per row.** A row is an x-band of the strip: the bands `[x, x + length]` of the placed shapes are joined where they overlap, and each joined band is one row (bands that only touch are two rows). Length to buy = strip + strip × shrinkage % + repeat × rows. Repeat 0 (the default) adds nothing. Tailors differ here; one repeat per row lets every row slide to the same point of the print.
2. **Rounding.** The total in mm is rounded **up** to the next 100 mm (0.1 m), with an epsilon of 0.01 mm so an exact multiple (1000 mm) stays 1.0 m and floating point noise never adds 0.1 m. An empty kind is 0 m.
3. **`NESTING_VERSION`** (`packages/nesting/src/nesting-version.ts`, starts at `1.0.0`) is stored with each saved calculation (ADR-312 item 5). Bump it when a change can move a placement or change a length for the same input: major for a new algorithm, minor for a changed rule (slice width, orders, rounding), patch for a fix that moves a layout. The recorded lengths in `nest.regression.test.ts` fail on such a change, which is the reminder.
4. **Marker scene is data only.** `buildMarkerScene(pattern, prepared, kindResult)` returns the strip size, each placed outline and grain line as path data in mm (2 decimals, as the engine renderer writes them), a label point with the piece name, and the fold and selvedge lines. It follows the shape of the engine's `PatternScene` but does not import the renderer, because the dependency-cruiser rule `nesting-is-pure` allows only `@tafsila/engine/geometry` (decision 315 item 6). Drawing it is the viewer's, PDF's and projector's job (#later).
5. **Column coverage is conservative.** A column covers every y the outline reaches anywhere inside that column (exact per trapezoid between corners), not only where the column's centre line crosses it. The placement can then never overlap two outlines; the property test checks real polygon overlap with a 0.5 mm tolerance. The cost is a little more fabric on sloped edges (see the recorded lengths below).
6. **Benchmark.** `nest.bench.test.ts` times the three slowest ADR-313 cases (all three kinds together) against the 3 s budget of one kind. It is skipped when `CI` is set unless `NESTING_BENCH` is set; `pnpm --filter @tafsila/nesting bench` runs it locally.
7. **Too wide.** A kind's `doesNotFit` lists the preparation's too-wide pieces of that fabric (decision 315 item 3; `DoesNotFit` now carries `fabric`), then any shape wider than the strip handed straight to `nest`.

## Reason

All of it follows ADR-312 and ADR-313 and is cheap to change before the beta: no layouts are stored yet, and `NESTING_VERSION` keeps old ones apart later. A conservative cover guarantees FR-FAB-02's promise that pieces do not overlap once cut.

## Recorded lengths compared with the spike

Most of the 40 main strips are within 5 cm of the ADR-313 table. The largest differences come from the conservative cover (item 5) and tie rules the spike did not record: straight-skirt dress XXL 140 cm folded 1.81 m (spike 1.63 m), lined dress XXL 140 cm open lining 1.31 m (spike 1.10 m), circle-skirt dress M 115 cm open 1.60 m (spike 1.73 m). The bar stays Merna's hand layouts in #322 (±10 cm, ADR-313 "Revisit when"). The full table is in [the yardage regression test cases](../test-cases/engine/yardage-regression.md).

## Alternatives

- Centre-line coverage (the plan's first wording): faster to write, but a sloped edge can poke up to half a column into a neighbour.
- One repeat per piece: over-buys for small pieces placed beside a large one; one per strip: too little when rows of pieces sit one after the other.
- Rendering the marker with the engine's `buildPatternScene`: would break the `nesting-is-pure` boundary.
