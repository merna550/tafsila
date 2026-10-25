## Plan: #283 packages/export with the print tile layout for A4 and A0

Plan wave M4, 2026-10-25. No dependencies. Feeds #288 (A4 PDF) and #290 (A0 PDF): they only draw what this returns. ADR-281 items 2 and 4: pure, browser-run, no `pdf-lib` here yet (#282/#288 add it).

### Findings that shape the plan

- The engine already has everything needed, so nothing is re-implemented: `layoutSheet`, `SHEET_MARGIN_MM`, `SCALE_SQUARE_MM` (`render/sheet-layout.ts`), `translate`, `samplePath`, `pointInPolygon`, `Rect`, `segmentTouchesRect` (`geometry/`), all exported from `@tafsila/engine`.
- The sheet has a 20 mm empty border (`SHEET_MARGIN_MM`) and wraps at 1200 mm. Tiling the **content box** (sheet minus that border) instead of the whole sheet makes a full-width sheet (≤ 1160 mm content) fit one A0 landscape column (1169 mm printable) instead of two.
- A tile can be empty of lines but sit fully inside a big piece (a circle skirt): emptiness needs a point-in-polygon check, not only a line check.

### Approach

1. **Scaffold** `packages/export` (`@tafsila/export`), copied from `packages/utils`: `package.json` (deps `@tafsila/engine`, `@tafsila/schemas`; dev `fast-check`, `@vitest/coverage-v8`, `@tafsila/test-fixtures`; scripts `typecheck`, `test`), `tsconfig.json`, `vitest.config.ts` (coverage floor as the engine, 85 %). No turbo or workspace change needed (`packages/*` glob). `.dependency-cruiser.cjs`: rule `export-is-pure` (from `^packages/export` to `^apps/`, `^packages/(api|ui|config)`, `node_modules/(next|react|hono|@supabase)`).
2. **`src/tiles/paper.ts`**: `PaperId = "A4" | "A0"`, `PAPERS` (A4 210 x 297, margin 10, overlap 10, portrait only; A0 841 x 1189, margin 10, overlap 0, portrait or landscape). Every number a named, documented constant (A0 margin: copy-shop plotters do not print to the edge).
3. **`src/tiles/tile-input.ts`**: `tileInput(result: PatternResult): TileInput = { area: Rect; outlines: Point[][] }`: `layoutSheet`, each piece's `samplePath(translate(cutPath, offset))`, plus the sheet scale square as a closed outline (so its tile is never skipped); `area` = sheet inset by `SHEET_MARGIN_MM`.
4. **`src/tiles/tile-sheet.ts`**: `tileSheet(input: TileInput, paper: PaperId): Tiling`.
   - printable `pw x ph` = paper minus 2 x margin; step = printable − overlap; `cols = max(1, ceil((W − overlap) / stepX))`, same for rows.
   - every window is the full printable size, starting at `area.minX + c·stepX`, `area.minY + r·stepY` (same scale and origin rule on every page; the last column may run past the area, blank).
   - A0: try portrait and landscape, keep fewer printed tiles; tie → portrait.
   - labels: column letter + row number, `A1` top-left, physical left-to-right in both locales (like the viewer canvas, decision 243 item 4); `columnLetter(26) = "AA"`.
5. **`src/tiles/occupancy.ts`**: `isTileEmpty(window, outlines)`: false when any outline segment touches the window (`segmentTouchesRect`) or the window centre is inside an outline (`pointInPolygon`). Bounding-box pre-filter per outline for speed.
6. **`src/tiles/marks.ts`**: `alignmentMarks(tile, grid)`: for each side that has a neighbour, the line where the overlap starts (A4: `maxX − overlap` on the right, `minX + overlap` on the left, same for top/bottom; A0: the window edge itself) with the neighbour's label.
7. **`src/tiles/page-map.ts`**: `pageMap(tiling, boxMm)`: scale factor that fits the tiled area into `boxMm` (the map's place on the cover page, #288 picks it) and each tile's scaled rectangle, label and `empty` flag.
8. **`src/index.ts`**: public API only (`tileInput`, `tileSheet`, `pageMap`, `PAPERS`, types).

### Data (plain JSON, no API, no schema change)

```ts
type TileInput = { area: Rect; outlines: readonly (readonly Point[])[] }; // sheet mm
type AlignMark = { side: "left" | "right" | "top" | "bottom"; from: Point; to: Point; neighbour: string };
type Tile = { label: string; col: number; row: number; window: Rect; empty: boolean; marks: AlignMark[] };
type Tiling = {
  paper: PaperId;
  orientation: "portrait" | "landscape";
  cols: number;
  rows: number;
  printableMm: { widthMm: number; heightMm: number };
  overlapMm: number;
  tiles: Tile[]; // row-major, all tiles
  printed: string[]; // labels of non-empty tiles, in print order
  skipped: string[];
}; // labels of empty tiles (listed on the page map)
type PageMap = {
  scale: number;
  widthMm: number;
  heightMm: number;
  tiles: { label: string; rect: Rect; empty: boolean }[];
};
```

### Tests (all in `packages/export`, run with `pnpm --filter @tafsila/export test`)

- Unit `tile-sheet.test.ts`: area 150 x 200 → one A4 tile `A1`; area 1200 x 1500 on A4 → cols `ceil(1190/180) = 7`, rows `ceil(1490/267) = 6`; on A0 → landscape 2 x 2 vs portrait 2 x 2 tie → portrait (assert the computed grid, written out in the test); area 1160 x 800 → one A0 landscape tile (portrait would need 2); labels `A1..G6`, `columnLetter(0/25/26) = A/Z/AA`.
- Unit `occupancy.test.ts`: window crossed by a line → not empty; window fully inside a 2 m circle outline → not empty; window away from all outlines → empty; the scale-square tile of `tileInput(seedDress M)` is printed.
- Unit `marks.test.ts`: corner tile of a 2 x 2 A4 grid has 2 marks at 10 mm inside its right and bottom edges; A0 marks sit on the edges.
- Unit `page-map.test.ts`: map fits inside `boxMm`, keeps the aspect ratio, `skipped` tiles flagged.
- Property `tile-sheet.property.test.ts` (fast-check, area 1..4000 x 1..4000 mm, both papers): union of windows covers the area (sample a grid of points every 7 mm, each inside some window); horizontal and vertical neighbours overlap by exactly `overlapMm` (± 1e-9); no window larger than the printable area; `printed ∪ skipped` = all labels, disjoint.
- Fixture: `tileInput` on `seedDress` M has one outline per piece plus the square, all inside `area`.
- No visual or e2e tests here (nothing drawn); physical accuracy stays in #295.

### Docs

`docs/export/README.md` (new: purpose, tile rules, constants, how #288/#290 use it), one row in `docs/ARCHITECTURE.md` (table of parts) and `docs/CONTEXT_MAP.md` ("Print/PDF export work"), JSDoc on every function and type. No SRS, OpenAPI, Postman or seed change. No manual test cases (pure maths; #295 is the physical check).

### Decisions (build writes `docs/decisions/283-print-tiles.md`)

1. Tiles cover the sheet's content box, not its empty 20 mm border, so a full-width sheet fits one A0 landscape column.
2. Every tile window is the full printable size from a fixed grid origin; the last column/row may extend past the content (blank paper), never shrunk.
3. A0 has a 10 mm margin (plotters do not print to the edge) and no overlap; sheets are butted along the alignment marks.
4. A tile is empty when no cut line crosses it and it is not inside a piece; the sheet's scale square counts as content.
5. Labels are physical (`A1` top-left, letters left to right) in both locales.
6. `packages/export` depends only on `@tafsila/engine` and `@tafsila/schemas`; the dependency-cruiser rule keeps it pure. `pdf-lib` arrives with #288.

### Risks

- Sampled outlines miss a thin sliver crossing a corner of a tile: sampling uses the engine default (`POLYGON_SAMPLES_PER_CURVE`); a test with a curve just clipping a tile corner guards it.
- New package not picked up by CI/turbo/coverage: the build checks that `pnpm quality && pnpm test` lists `@tafsila/export`.
- #288 may want a different overlap or margin after the spike #282: the constants are named in one file.

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged: pure maths, interfaces fixed above). `needs-interactive`: no (script says `no`). Status stays `status:plan-review` (plan:opus) until Merna approves.

## Deviations

- `alignmentMarks` takes a small grid object with an `isPrinted` callback and only marks printed neighbours (an empty neighbour is never laid).
- Tile windows are computed per orientation and A0 compares printed-tile counts, as planned.
- Added `tileLabel` and a `columnLetter` export; a test-case file was added although the plan listed none (requested by the dispatcher).
