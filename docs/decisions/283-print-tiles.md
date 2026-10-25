# ADR-283 · 2026-10-25 · Print tile layout for A4 and A0

**Context:** #283 creates `packages/export` with the tile maths that the A4 PDF (#288) and A0 PDF (#290) draw. The sheet from `layoutSheet` has an empty 20 mm border and wraps at 1200 mm.
**Decision:**

1. Tiles cover the sheet's content box, not its empty 20 mm border, so a full-width sheet (1160 mm) fits one A0 landscape column (1169 mm printable).
2. Every tile window has the full printable size and starts on a fixed grid origin; the last column or row may extend past the content (blank paper), never shrunk. Scale and origin are therefore identical on every page.
3. A0 has a 10 mm margin (plotters do not print to the edge) and no overlap; sheets are butted along the alignment marks. A4 has a 10 mm margin and 10 mm overlap, portrait only.
4. A tile is empty when no cut line touches it and its centre is not inside a piece; the sheet's scale square counts as content. Empty tiles are skipped and listed on the page map.
5. Labels are physical (`A1` top-left, letters left to right) in both locales, like the viewer canvas (ADR-243 item 4).
6. `packages/export` depends only on `@tafsila/engine` and `@tafsila/schemas`; the `export-is-pure` dependency-cruiser rule keeps it pure. `pdf-lib` arrives with #288.

**Reason:** Fewer pages, one rule for scale, and a thin PDF layer that only draws.
**Alternatives:** Tiling the whole sheet (an extra A0 column for a full-width sheet); shrinking the last tile (breaks the one-origin rule).
