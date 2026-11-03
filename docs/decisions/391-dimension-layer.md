# ADR-391 · 2026-11-03 · Dimension layer: lengths in cm and curve markers, opt-in

**Context:** Issue #391 (FR-PAT-02, FR-VIEW-02). Anyone who cuts on fabric by hand needs the length of every edge and to know which edges are curves. The SVG showed only names, grain, notches and the scale square. Merna asked for an optional layer in the engine.
**Decision (cheap to reverse, decided by the author):**

1. **Opt-in layer.** `dimensions` is one more name in `SVG_LAYERS`, but `DEFAULT_SVG_LAYERS` leaves it out. The standard print, the viewer's SVG and every stored snapshot stay byte for byte as they were, so `ENGINE_VERSION` is not bumped. `pnpm engine:print <fixture> <size> --dimensions` turns it on.
2. **What it draws.** For each stitch edge: its sewn length in cm with one decimal (`Math.round(mm) / 10`), turned along the edge and placed inside the piece. For each curve: a dashed chord, a depth line from the chord to the deepest point, and the words `قوس` (arc depth) and, for one circular arc, `نق` (radius), both in cm.
3. **What counts as a curve.** An edge with at least one cubic segment that strays more than 0.5 mm from the straight line between its ends. A run of lines with a corner is not a curve; a Bézier drawn flat is not a curve.
4. **When a radius is quoted.** Only when every sample lies within 1 mm of the circle through the two ends and the deepest point (circle skirts, hems). A neck or armhole curve changes radius along its length, so it gets a depth and no radius, so the number is never invented.
5. **Viewer data.** `buildPatternScene` adds an optional `curve: { depthMm, radiusMm? }` to an edge so the web viewer can show the same on its own toggle later (the web toggle is out of scope).
6. **Language.** Digits are Latin and the words are Arabic, like the other labels in the SVG; the layer writes no English.

**Reason:** A hand cutter can measure a straight edge from its number and see a curve from its marker, with no change to existing prints. Quoting a radius only for real arcs keeps the numbers honest.
**Alternatives:** Always on (changes every snapshot and print, and clutters pieces for people who only print); drawing dimension lines with arrowheads (heavy on small pieces); a radius for every curve (a wrong number for a neckline); curve depth measured to the stitch line only at mid-length (misses an S curve's real deepest point).
