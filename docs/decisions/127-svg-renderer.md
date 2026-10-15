# ADR-127 · 2026-10-15 · Deterministic SVG renderer and print script

**Context:** Issue #127 (NFR-08, FR-PAT-02, SRS §11). The plan is the comment on the issue (no plan file, Merna's request).
**Decision:**

1. **Plain SVG text** built by string concatenation, no SVG library: zero dependencies and full control of the bytes.
2. **Numbers** are written with 2 decimals; `-0.00` becomes `0.00`; a non-finite number throws `DraftingError` (`RENDER_NON_FINITE`).
3. **Layout:** pieces side by side, wrapping at 1200 mm (about a plotter roll), gap 50 mm, margin 20 mm. The scale square sits bottom-left, outside every piece cell.
4. **Only what the result contains** is drawn: no invented labels. Labels come from the finishing/layout steps (#131).
5. **`scale`** changes the physical `width`/`height` only, never the `viewBox`. The print script always uses 1.
6. **Snapshot helper** `expectSvgSnapshot` is exported as `@tafsila/engine/testing` so vitest never enters app bundles. Snapshots are `.svg` files in `__snapshots__/`, reviewable as images.
7. **`pnpm engine:print <fixture> <size> [--out file.svg]`** accepts `rectangle` or a design fixture name and a `SIZE_MATRIX` id. It exits 1 while the registry produces no pieces, 2 for wrong arguments.
8. **Font family** is the constant `SVG_FONT_FAMILY`, mirrored from `--font-sans` in `tokens.css` (the engine cannot import `packages/ui`); a test fails if the first two families drift.
9. **Marks:** notch = 5 mm tick across the stitch line; grain line with two arrowheads; dart = leg, apex, leg. Stroke widths are named constants (cut 0.35 mm, stitch 0.25 mm dashed 3/1.5).
10. `tsx` is added to the engine devDependencies to run the print script.
