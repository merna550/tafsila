# ADR-288 · 2026-10-25 · One tiled PDF builder for A4 and A0

**Context:** #288 builds the A4 PDF (cover, test square, page map, tiles); #290 builds the A0 PDF from the same drawing code.
**Decision:**

1. One generic `buildTiledPdf(result, scene, meta, paper, options, withCover)`; `buildA4Pdf` is a thin wrapper with the cover, #290's `buildA0Pdf` will be the same without it. `buildA4Pdf(result, scene, meta, { fonts, onProgress })` returns `{ bytes, pageCount, tileCount }`.
2. Fonts and progress come in through `PdfBuildOptions`; the package does no I/O and has no DOM, so it runs in a worker.
3. Reproducible files: dates come from `meta.createdAt`, fixed font names (ADR-282), no object streams. A test fails if `Date.now`, `new Date()`, `Math.random` or `performance.now` appear in `src/pdf`.
4. Page 1 is the cover (100 mm test square, "measure me", title block, page map, print-at-100% line); tile pages follow in row order; empty tiles get no page and are crossed out on the map.
5. Pieces are drawn with `drawSvgPath` at `MM_TO_PT`, clipped to the printable rectangle; line widths and dashes are named constants in `style.ts` (points, converted because `drawSvgPath` scales them with the path). Labels are the engine's Arabic text, turned by the engine's `rotationDeg`.
6. The tile label and footer sit in the page margin, outside the clip, so they never hide pattern lines. The tile label, map tiles and test square are wrapped in named marked content (`Tile_B2`, `MapTile_B2`, `MapEmpty_B2`, `TestSquare`) so tests read them back.
7. Words on the PDF are in `strings.ts` (ar + en) and listed in `docs/design/copy.md`; digits are Western (NFR-06).

**Reason:** A0 only changes paper and cover, so one builder avoids a second copy of the drawing code.
**Alternatives:** Separate A4 and A0 builders (duplication); drawing text as outlines (ADR-282).
**Limits:** Physical accuracy (square 10 cm ± 1 mm, toile) is checked by hand in #295. Neighbour hints ("to B3") are not drawn.
