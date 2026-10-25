# ADR-282 · 2026-10-25 · PDF library and Arabic labels

**Context:** #282 is the M4 spike for the PDF family (#288 A4, #290 A0): can a browser PDF carry Arabic labels that read correctly and vector lines that are exactly 1:1?
**Decision:**

1. `pdf-lib` 1.17.1 with `@pdf-lib/fontkit` 1.1.1, in `packages/export`. No server code, no paid service.
2. Fonts are injected as bytes (`PdfFonts`); the package imports no font file. IBM Plex Sans Arabic Regular and Bold (SIL OFL 1.1, `OFL.txt` beside them) live in `apps/web/public/fonts/`, and the export worker fetches them only when export runs.
3. Fixed font names (`customName` `TafsilaPlexArabic-Regular|Bold`) and fixed document dates give byte-identical files for the same input (tested).
4. Arabic route used: **(b) reorder direction runs ourselves** (`shapeForPdf` in `src/pdf/arabic-text.ts`). Finding: fontkit joins Arabic letters and lays an all-Arabic string out in visual order (route (a) works for pure Arabic), but it treats a mixed string as one right-to-left run, so Latin names reverse ("Nour" shows as "ruoN") and Arabic-Indic digit groups reverse ("١٢" shows as "٢١"). `shapeForPdf` splits the label into Arabic, Arabic-Indic digit and other runs, orders runs visually, pre-reverses digit runs, and each run is drawn on its own. Routes (c) outlines and (d) Latin-only were not needed.
5. Tests read drawing back from the content stream: test drawing is wrapped in marked content (`/TestSquare BMC ... EMC`), `src/pdf/test-support/read-pdf.ts` decodes it (with `q`/`Q`/`cm`) and returns points, rectangles and bounds in pt. A 100 mm square reads back as 283.46 pt; the engine outline drawn with `drawSvgPath` and `scale: MM_TO_PT` has the engine bbox in pt, y flipped.
6. Measured (`pnpm --filter @tafsila/export spike:pdf`): one-page sample with both font subsets 13.6 KB; PDF code chunk (pdf-lib + fontkit + `drawLabel`) 963 KB minified, **376 KB gzip** (under the 500 KB bar); full fonts the worker downloads 230 KB + 241 KB (205 KB gzip together), cached by the browser.
7. `pdfjs-dist` from the plan was not added: this environment has no browser, so the PNG is rendered with `pdftoppm` (poppler) when it exists, and the Chrome and pdf.js check is a human step on #295.

**Reason:** One library that runs in the browser with subset embedding and exact point coordinates; a 40-line run splitter is cheaper than a bidi library or glyph outlines, and keeps text selectable and searchable.
**Alternatives:** pdfmake/jsPDF (no real Arabic shaping); drawing glyph outlines as paths (route c, larger files, no text); server rendering (violates the free tiers and offline goal).
**Limits:** mirrored brackets and bidi levels beyond one level are not handled; labels are short names, numbers and dashes. Revisit if a label needs nested direction.
