# ADR-290 · 2026-10-26 · The A0 file reserves a header band instead of a cover page

**Context:** #290 adds the A0 copy-shop PDF on top of #288's `buildTiledPdf`. A0 needs the 10 cm test square and the title block, but a cover page would turn a one-sheet pattern into two sheets of expensive paper.
**Decision:**

1. Sheet 1 reserves a 140 mm band (100 mm square + 40 mm of margins, `A0_HEADER_MM`) at its top-left. The band is added to the tile input (pieces move down by it, the band is an outline so its tile is never skipped), so #283's `tileSheet` is used unchanged. The pieces are drawn with the window moved back by the same amount.
2. `buildA0Pdf` is a wrapper over `buildTiledPdf` with `{ paper: "A0", withCover: false, withHeader: true }`. The cover helpers (test square, title block, page map) were given positions so A4 and A0 share them.
3. The tile label and the page map appear on A0 only when the file has more than one sheet.
4. The seed dress takes 3 A0 sheets with the band (2 without); pinned in `a0-pdf.test.ts`. Margins were not changed because no pattern went from 1 sheet to 2 only because of the band in the tests.
5. The file name is `<title>-v<N>-A0.pdf`; the dialog row is A0 (copy shop) and its note tells the user to ask the shop for 100 %. Physical accuracy of a real A0 print is checked in #295.
