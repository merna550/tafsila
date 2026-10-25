## Plan: #282 spike: Arabic labels and 1:1 vector lines in a browser PDF

Plan wave M4 (PDF family), 2026-10-25. Planned together with #288, #289, #290; the contract names below are shared by all four. Tile maths belong to #283 (not used here).

### Approach

The spike keeps its code: instead of a throwaway script it builds the two PDF helpers #288 and #290 will reuse, so nothing is written twice. Build **after #283 is merged** (it creates `packages/export`); this issue adds only the files below, the two dependencies and the decision.

1. Add to `packages/export` (exact versions, both at least two weeks old): dependencies `pdf-lib`, `@pdf-lib/fontkit`; devDependencies `esbuild` (chunk-size measure), `pdfjs-dist` (render the PDF to PNG in a script, not in tests).
2. Fonts: IBM Plex Sans Arabic Regular + Bold (OFL) in `apps/web/public/fonts/` with `OFL.txt` beside them. The package does **not** import font files: callers inject bytes (`PdfFonts`), so the package stays pure and the font stays out of every bundle until export runs (the worker fetches `/fonts/...` on demand).
3. `src/pdf/units.ts`: `MM_TO_PT = 72 / 25.4`, `mmToPt(mm)`, `A4_PT`, `A0_PT` (named, documented).
4. `src/pdf/fonts.ts`: `type PdfFonts = { regular: Uint8Array; bold: Uint8Array }`; `embedFonts(doc, fonts): Promise<EmbeddedFonts>` registers fontkit, embeds with `{ subset: true, customName: "TafsilaPlexArabic" }` (a fixed name: pdf-lib adds a random suffix otherwise, which would break #288's byte-identical rebuild; the spike proves it).
5. `src/pdf/arabic-text.ts`: `drawLabel(page, fonts, text, { x, y, sizePt, bold?, align: "start" | "end" | "center", rtl: boolean })` and `shapeForPdf(text): string`. Try in this order and stop at the first that reads right in Chrome and pdf.js: (a) draw as is (fontkit shapes joins; check run order), (b) reorder bidi runs before drawing (pure function, unit-tested with "أمام - قص ٢" and a mixed Latin client name), (c) draw glyph outlines as SVG paths (`font.layout` -> `drawSvgPath`), (d) Latin-only labels with the Arabic name on the page map. The chosen route is the only code left in the file.
6. `src/pdf/test-support/read-pdf.ts` (test helper, exported only to tests): `pageSizes(bytes)`, `markedRects(bytes, tag)` that decodes the content stream and returns the `re` rectangles between `/<tag> BMC` ... `EMC`. Drawing code wraps the test square in marked content `TestSquare` with `pushOperators(PDFOperator.of("BMC", [PDFName.of("TestSquare")]))`. This is how "read back" works without parsing the whole PDF; #288 and #290 reuse it.
7. `src/pdf/spike.test.ts` (kept as a regression test) and script `pnpm --filter @tafsila/export spike:pdf` that writes `packages/export/spike-out/spike.pdf` (+ PNG via pdfjs) and prints sizes; `spike-out/` in `.gitignore`.
8. `docs/decisions/282-pdf-library.md` and technology card `docs/handbook/tech/pdf-lib.md` (`packages: [pdf-lib, "@pdf-lib/fontkit"]`; also card entry for `esbuild`/`pdfjs-dist` in the same file or `pdfjs.md`, so `pnpm docs:check` passes).

### Files

Create: `packages/export/src/pdf/{units,fonts,arabic-text}.ts`, `packages/export/src/pdf/test-support/read-pdf.ts`, `packages/export/src/pdf/spike.test.ts`, `packages/export/scripts/spike-pdf.ts`, `apps/web/public/fonts/IBMPlexSansArabic-{Regular,Bold}.ttf`, `apps/web/public/fonts/OFL.txt`, `docs/decisions/282-pdf-library.md`, `docs/handbook/tech/pdf-lib.md`. Change: `packages/export/package.json`, `pnpm-lock.yaml`, `.gitignore`, `docs/handbook/tech/README.md` (index).

### Data / API

None (no server, no schema). The package-level API this spike fixes for #288/#290: `PdfFonts`, `EmbeddedFonts`, `drawLabel`, `mmToPt`, `MM_TO_PT`.

### Tests

- Unit: a 100 x 100 mm square drawn with the engine path of a real fixture piece plus `mmToPt` reads back as 283.46 pt (+-0.01) on both axes via `markedRects`; the piece outline drawn with `drawSvgPath` and `scale: MM_TO_PT` has a bounding box equal to the engine bbox in pt (+-0.01) (y flip checked: a point at the top of the piece is at the top of the page).
- Unit: the label "أمام - قص ٢" and a mixed string ("فستان - Nour") give the expected glyph order (assert the shaped-run output of the chosen route; this is the check that it is not reversed) and the PDF embeds a subset (file under 120 KB for the one-page sample).
- Unit: building the same PDF twice with a fixed `CreationDate` gives byte-identical output (proves `customName` and metadata settings; #288 relies on it).
- Script output attached to the PR: PNG of the sample page (pdf.js), file size, esbuild gzip size of the PDF code (pdf-lib + fontkit + `drawLabel`) with the font subset size listed separately, and the full-font download size (what the worker fetches).
- Merna's check (she is listed for this in the M4 brief): open `spike.pdf` in Chrome's PDF viewer and confirm the label reads correctly. The builder attaches the PDF and the pdf.js PNG; the Chrome screenshot needs a screen, so AC 2 is closed by her screenshot. No new e2e or manual case file (the spike has no UI).

### Docs

Decision file, tech card, `docs/handbook/tech/README.md`, `docs/SRS.md` untouched. JSDoc on every function and type.

### Decisions (build writes `docs/decisions/282-pdf-library.md`)

1. `pdf-lib` + `@pdf-lib/fontkit` unless the spike shows it cannot (then say what replaced it); no server code, no paid service.
2. Fonts are injected as bytes (`PdfFonts`), stored in `apps/web/public/fonts/`; the package never imports a font file.
3. Fixed font `customName` and fixed dates so a PDF is byte-reproducible.
4. Test square is wrapped in marked content `TestSquare`; tests read rectangles back from it.
5. The Arabic route actually used (a to d above), the gzip chunk size and the full/subset font sizes are recorded in the file.

### Risks

- Arabic joins fine but run order is reversed: handled by fallback (b), then (c). The fallback order is fixed above so the builder does not ask.
- Chrome's viewer can differ from pdf.js: Merna's screenshot is the acceptance for this; if it differs, route (c) is chosen because paths do not depend on the viewer's shaping.
- Font weight too large for mobile data: it is fetched only when the user presses export, and cached by the browser; recorded in the decision with the number.
- If PDF code is over 500 KB gzip, record it and propose lazy-loading (already in a worker chunk); do not change the library without a new decision.

**Size:** S (unchanged). **Build:** `build:sonnet` (unchanged). Order: after #283. `needs-interactive`: no.

---

_Generated by [Claude Code](https://claude.ai/code)_

## Deviations

- `pdfjs-dist` not added: no browser in the build environment; the script renders the PNG with `pdftoppm` when present, and the Chrome check is a human step on #295 (ADR-282 item 7).
- `shapeForPdf(text, rtl)` returns the strings to draw left to right (one per run) instead of a single string.
- Added `tsx` (devDependency, already in the repo) to run the spike script; the sample builder lives in `src/pdf/spike-pdf.ts`; test cases are in `docs/test-cases/export/282-pdf-arabic-spike.md`.
