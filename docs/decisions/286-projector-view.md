# ADR-286 · 2026-10-25 · Projector view: SVG at two stored factors, physical keys

**Context:** FR-PROJ-01, FR-PROJ-03 and FR-PROJ-05 need the saved pattern at 1:1 on the cutting table, with a verification square and mirror. [ADR-281](281-m4-scope.md), [ADR-285](285-projector-calibration.md) (calibration) and ADR-243 (scene from the worker) apply. The approved screen is `docs/design/screens/Projector.dc.html`.
**Decision:**

1. The canvas is one SVG; the pattern group is scaled by `pxPerMmX` and `pxPerMmY`. Strokes use `vector-effect: non-scaling-stroke`, so the line width is exactly what the toolbar says whatever the factors are.
2. Pan is kept in screen mm and applied outside the mirror flip, so arrow keys and drag are physical (right is right, also when mirrored). Mirror flips only the pattern group, never the verification square or the toolbar. `screenDeltaToSceneMm` is the helper #287 uses for piece moves.
3. Keys are bound by `event.code`, so an Arabic keyboard layout works. Arrows pan 1 mm, Shift 10 mm, Alt 50 mm (Alt wins); `M` mirror, `F` fullscreen, `[` and `]` line width, `?` help. Keys are ignored inside inputs (the line width slider keeps its arrows) and while the help window is open.
4. Line width (1 to 6 px) and colour (white or yellow) are saved per device in `tafsila.projector.view`; pan and mirror are not.
5. The scene comes from the preview worker run of the version's stored inputs (`versionPreviewInput`, shared with the read-only version screen); no geometry in `apps/web`.
6. The projector entry is a "Use this version" bar on the version view with the projector button; below `md` it is disabled with a visible reason, not hidden. #288 and #289 add their buttons to the same bar.
7. Without a valid calibration (missing or stale) the route replaces itself with the calibration page.
   **Reason:** two factors match what the user measured; physical keys are the only thing that feels right while tracing at a table; sharing the scene input removes a duplicate.
   **Alternatives:** canvas 2D (no per-piece hit testing for #287, blurry zoom); a uniform scale (hides the X/Y error the calibration measures); keys by `event.key` (breaks on Arabic layout).
