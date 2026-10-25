# Export — `packages/export`

Pure data in, data out: takes a `PatternResult`, returns plain JSON that the PDF code only draws. No UI, API or framework code (dependency-cruiser rule `export-is-pure`). PDF helpers (units, fonts, Arabic labels, test reader) are in `src/pdf/` ([ADR-282](../decisions/282-pdf-library.md)); the A4 PDF is [ADR-288](../decisions/288-pdf-builder.md). Decisions: [283](../decisions/283-print-tiles.md), [281](../decisions/281-m4-scope.md).

## Print tiles

```ts
import { tileInput, tileSheet, pageMap } from "@tafsila/export";
const tiling = tileSheet(tileInput(result), "A4"); // or "A0"
const map = pageMap(tiling, { widthMm: 120, heightMm: 160 });
```

- `tileInput` lays the pieces on the engine's print sheet and returns the content box (sheet minus its 20 mm border) and one closed outline per piece plus the scale square.
- `tileSheet` cuts the box into windows of the full printable size on a fixed grid. Same scale and origin on every page; the last column or row may run past the content (blank paper).
- A tile is **empty** (not printed, listed on the page map) when no outline side touches it and its centre is not inside a piece.
- Labels are physical: `A1` is top-left, letters run left to right, rows top to bottom, in Arabic and English alike.
- Alignment marks sit where the neighbour's overlap starts (on the window edge for A0), only toward printed neighbours.

| Paper | Page (mm)  | Margin | Overlap | Orientation                                                    |
| ----- | ---------- | ------ | ------- | -------------------------------------------------------------- |
| A4    | 210 x 297  | 10     | 10      | portrait                                                       |
| A0    | 841 x 1189 | 10     | 0       | portrait or landscape (fewer printed tiles, portrait on a tie) |

All numbers are named constants in `src/tiles/paper.ts`. #288 (A4 PDF) and #290 (A0 PDF) may retune them there. Physical accuracy of prints is checked in #295.

Tests: `pnpm --filter @tafsila/export test` (unit, fast-check properties, a seed-dress fixture).

## A4 PDF

```ts
import { buildA4Pdf } from "@tafsila/export";
const { bytes, pageCount, tileCount } = await buildA4Pdf(result, buildPatternScene(result), meta, {
  fonts,
  onProgress,
});
```

- Page 1 is the cover: 100 mm test square, "measure me", title, version, client, engine version, page map (empty tiles crossed out). Tile pages follow, one per non-empty tile, with alignment marks, a dashed overlap hint, the tile label (`B2`) and a footer.
- Drawing is at 1:1 in vector paths; the same `drawPiecesInWindow` will draw A0 (#290) through `buildTiledPdf`.
- Pure and reproducible: no clock, no random, dates from `meta.createdAt`. No DOM, so it runs in a worker (#289).
- Look at it: `pnpm --filter @tafsila/export render:sample` writes the seed dress PDF and PNGs (needs `pdftoppm`) and prints the build time.
