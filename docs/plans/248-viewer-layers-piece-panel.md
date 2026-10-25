# Plan: #248 viewer layer toggles and piece details panel

Plan wave M3, 2026-10-19. Depends on #243, which owns the viewer contract (`PatternViewerProps`, `ViewerController`, `PatternScene`, `useViewerState`); read its plan comment and `features/pattern-viewer/model/types.ts` first. This issue adds UI only: no new props on `PatternViewer`. Must match the pattern-page screen in `docs/design/screens/` (#236) for the side panel and toggle placement.

### Approach

- `LayerToggles`: a group of five checkbox-style toggle buttons (cut line "seam allowance", notches, labels, grid; stitch line stays on, as the issue lists four) bound to `controller.layers` / `toggleLayer`. The viewer already hides layers from `layers` (#243). State survives reloads through #243's `localStorage` persistence (per viewer). Each toggle is a real `<button aria-pressed>` with text.
- `PieceList`: a list of all pieces (button per piece, Arabic/English name by locale) for keyboard and screen readers; selecting calls `controller.selectPiece(id)`; the selected one has `aria-current`. Click on the canvas already selects (#243).
- `PiecePanel` props: `{ piece: ScenePiece | null; locale }` (pure view, page passes the selected scene piece; renders an empty hint when `null`). Shows: name (ar and en), cut text ("cut 2", "cut 1 on fold", mirrored, fabric main/lining/interfacing) from `piece.cut`, bounding size in cm from `piece.bboxMm` (formatted with `shared/format`), and a table of edges: name/id, length in cm (`edge.lengthMm`), seam allowance in cm (`edge.seamAllowanceMm`). Escape clears the selection (handled in #243's key handler; add the test here).
- Values are only formatting of scene fields: `lengthMm` comes from the engine's `edgeLengthMm` inside `buildPatternScene` (#243), bbox and cut from the `PatternResult`. No maths in the UI beyond mm to cm in the existing formatter.
- Selection style on the canvas is #243's `data-selected`; this issue only checks it in the snapshot.

### Files

Create in `apps/web/src/features/pattern-viewer/`: `components/LayerToggles.tsx`, `components/PieceList.tsx`, `components/PiecePanel.tsx`, `model/piece-details.ts` (pure: `pieceDetails(piece): { name, cutKind: "fold"|"pair"|"single", quantity, fabric, widthCm, heightCm, edges: {id, lengthCm, allowanceCm}[] }`), tests beside each, `docs/test-cases/ui/248-viewer-layers-piece-panel.md`. Change: `index.ts` (export the three components), `apps/web/messages/ar.json` and `en.json` (`patternViewer.layers.*`, `patternViewer.piece.*`, cut-text plurals with ICU plural rules for Arabic), the dev route `app/[locale]/dev/pattern-viewer/page.tsx` (mount toggles, list and panel next to the viewer). Edge names: use the edge `id` humanised through an `edgeLabel` messages map if one exists in the engine i18n (`packages/engine/src/i18n`); otherwise show the id (decision below).

### Tests

- Unit: `pieceDetails` on `seedDress` pieces: a fold piece gives "cut 1 on fold", a pair piece "cut 2", lining fabric label, bbox cm = `bboxMm/10` to 1 decimal, each edge `lengthCm` = `edgeLengthMm/10`, allowance cm; Arabic-Indic digit formatting follows the existing formatter in `ar`.
- Server-render: with `layers.notches = false` the markup has no notch group; same for labels, cut and grid; each toggle renders `aria-pressed` matching state; `PiecePanel` markup for a known piece contains its Arabic name in `ar`, English in `en`, and `dir` follows the locale; `null` shows the hint.
- E2E (dev route, `ar` and `en`, plus the 360 px touch project): click a piece opens the panel with the right name and cut text; choosing it from the list does the same and the canvas piece gets `data-selected`; Escape clears; each toggle hides its layer in the DOM; reload keeps toggles.
- Visual: viewer with SA (cut) off; viewer with a selected piece and the panel, `ar`.
- Manual: TC-UI-248-01..02 (screen reader reads the list and panel; SA toggle against a printed pattern).

### Docs

`docs/frontend/README.md` viewer section (panel and toggles), `docs/test-cases/ui/248-...`. No SRS or API change.

### Decisions (build writes `docs/decisions/248-viewer-layers-panel.md`)

1. The panel is a pure view over a `ScenePiece`; selection lives in `ViewerController` (one source for canvas, list, panel and the report).
2. Layer toggles cover cut (labelled "seam allowance"), notches, labels, grid; stitch line is always drawn.
3. Edge rows use the engine edge id when no localised edge name exists; naming edges is an engine content change and out of scope.

### Risks

- Arabic plural forms for "cut 2": use ICU `plural` in next-intl messages and test 1, 2, 3-10.
- If #243 changes the contract names, follow its merged `types.ts`, not this text.

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no.

## Deviations

- Layer toggles follow the approved pattern-page screen: five real checkboxes (stitch line, cut line labelled with the seam allowance, notches, names, grid), not four `aria-pressed` buttons; the stitch line can be switched off like the other layers (the viewer from #243 already supports it).
- `PiecePanel` props are `{ piece, position? }` (position gives "piece 1 of 4" from the screen); the page passes the selected scene piece.
- Escape clearing the selection was already in #243's key handler; the new e2e covers it.
- No visual baselines (no Docker here): listed in the follow-up #265.
- The e2e spec is one file, `pattern-viewer-panel.spec.ts`; the 360 px touch project is not extended.
