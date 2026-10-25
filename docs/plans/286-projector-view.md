<!-- Approved plan comment of #286 -->

## Plan: #286 projector view at 1:1 with verification square, pan and mirror

Plan wave M4, 2026-10-25. Planned with #285 and #287; the calibration store, routes, `features/projector/` layout and public API are fixed in the #285 plan and used as is. The build must match the projector screen in `docs/design/screens/` once #281 lands (control placement, help overlay, line colours); the interfaces below are fixed so the build does not guess. Follows ADR-281 items 1, 2, 6, ADR-243 items 1 and 4, ADR-252 item 2. Depends on #285.

### Approach

`ProjectorScreen` loads the saved version, gets its `PatternScene` from the preview worker (same path as `useReadOnlyVersion`, no geometry in `apps/web`), reads the calibration, and draws one full-viewport SVG. Units: the SVG user unit is the CSS px, so the pattern group's transform is a plain scale by the stored factors.

- **Scene input.** Add `versionPreviewInput(version): PreviewInput` to `features/pattern-versions/model/` (exported from its index) and use it in both `use-read-only-version.ts` and the new `hooks/use-projector-scene.ts` (`useProjectorScene(versionId) -> { version, scene, failure, loading }`: `useVersion` + `usePatternPreview`). This removes the duplicate input memo.
- **No valid calibration** (`missing` or `stale`): `router.replace` to `.../projector/calibrate`. While `loading` show nothing but the black page.
- **Pattern group** (not the verification square): `transform = translate(cx + panXpx, cy + panYpx) [scale(-1,1) when mirrored] scale(kx, ky) translate(-sheetCx, -sheetCy)` where `cx, cy` = viewport centre, `kx = pxPerMmX`, `ky = pxPerMmY`, `sheetCx, sheetCy` = centre of the scene box. Strokes use `vector-effect: non-scaling-stroke` with the chosen line width in px, so unequal X/Y factors never skew line weight. Layers drawn: cut (solid), stitch (dashed), grain, notches, labels; no hit-test paths.
- **Verification square** is a sibling `<rect>` outside the pattern group: 100 mm wide by `pxPerMmX`, 100 mm high by `pxPerMmY`, fixed near the bottom start corner, with the text "10 cm" beside it; never mirrored, never panned (FR-PROJ-03).
- **Mirror** flips the pattern group horizontally about the viewport centre. Labels flip with it (intended: projecting onto the wrong side of the fabric).
- **Keys are physical** (ArrowRight moves what you see to the right, also when mirrored): pan is stored in screen mm and converted by `screenDeltaToSceneMm(delta, mirror)` which negates x when mirrored (#287 reuses it for piece moves).

Pure model (`features/projector/model/`):

```ts
export type ProjectorView = { panMm: Point; mirror: boolean; lineWidthPx: number; color: "white" | "yellow" };   // panMm in screen mm
export const LINE_WIDTH_MIN_PX = 1, LINE_WIDTH_MAX_PX = 6, DEFAULT_VIEW: ProjectorView;
export type StepSize = "fine" | "medium" | "coarse";   // 1, 10, 50 mm
stepMm(event: { shiftKey: boolean; altKey: boolean }): 1 | 10 | 50
mmToPx(c: ProjectorCalibration, p: Point): Point                 // x * pxPerMmX, y * pxPerMmY
pxToMm(c, p: Point): Point
patternTransform(c, view: ProjectorView, viewport: { widthPx; heightPx }, sceneBox: { widthMm; heightMm }): string
verificationSquare(c, viewport): { x; y; widthPx; heightPx }     // 100 mm x 100 mm
panBy(view, deltaMm: Point): ProjectorView
screenDeltaToSceneMm(delta: Point, mirror: boolean): Point
clampLineWidth(n: number): number
keyAction(e: { code: string; key: string; shiftKey: boolean; altKey: boolean }): ProjectorAction | null
type ProjectorAction = { kind: "pan"; dx: -1 | 0 | 1; dy: -1 | 0 | 1; stepMm: 1 | 10 | 50 } | { kind: "mirror" } | { kind: "help" } | { kind: "lineWidth"; delta: 1 | -1 } | { kind: "rotate" } | { kind: "reset" } | { kind: "nextPiece" } | { kind: "prevPiece" } | { kind: "allPieces" } | { kind: "pieces" } | { kind: "fullscreen" }
```

Key map (by `event.code`, so it works on an Arabic keyboard layout): arrows = pan (Shift 10 mm, Alt 50 mm); `KeyM` mirror; `Slash`+Shift (`?`) help; `BracketLeft`/`BracketRight` line width -/+; `KeyF` fullscreen; `KeyR`, `KeyL`, `KeyA`, `PageUp`/`PageDown`, `Digit0` are for #287 (the type already exists here and the handler ignores them until #287 wires them). Drag pans with Pointer Events (delta px to mm with `pxToMm`, sign handled by `screenDeltaToSceneMm`).

Persistence: `tafsila.projector.view` (`DEFAULT_VIEW` fields except `panMm`, per device, `readJson`/`writeJson`, schema in `projector.schema.ts`); pan is not saved.

Components (`components/`): `ProjectorCanvas.tsx` (props `{ scene, calibration, view, viewport, visiblePieceIds: readonly string[] | "all", placements: Placements, activePieceId: string | null, onPiecePointerDown?: (id: string, e) => void }`: pure SVG, no state), `ProjectorToolbar.tsx` (fullscreen, mirror, line width slider, colour, recalibrate link, help; hidden-on-idle is not needed), `KeyboardHelp.tsx` (overlay on `?`, Escape closes; listed keys come from one const used by the test too), `hooks/use-projector-keys.ts`, `hooks/use-viewport-size.ts` (ResizeObserver, `{widthPx,heightPx}`), `ProjectorScreen.tsx`. `Placements` and `placementTransform(piece, placement): string` live in `model/placement.ts`, created here with the identity placement only (`IDENTITY_PLACEMENT`); #287 extends that file. With `placements = {}` the canvas draws the scene layout.

### Entry point

`apps/web/src/features/pattern-page/components/ReadOnlyVersionBody.tsx`: add a "Projector" link-button in the `PageHeader` actions to `/designs/<id>/versions/<versionId>/projector`. Below `md` width it is a disabled button with the reason text in `aria-describedby` ("Open on a computer connected to the projector"); the version number and engine version are printed on the projector page footer line (ADR-281 item 1) in the toolbar, not on the canvas.

### Files

Create in `features/projector/`: `model/projector-view.ts`, `model/keymap.ts`, `model/placement.ts` (identity part), `model/projector-view.test.ts`, `model/keymap.test.ts`, `hooks/use-projector-scene.ts`, `hooks/use-projector-keys.ts`, `hooks/use-viewport-size.ts`, `hooks/use-projector-view.ts` (view state + persistence), `components/ProjectorCanvas.tsx`, `ProjectorToolbar.tsx`, `KeyboardHelp.tsx`, `ProjectorScreen.tsx`, `projector.test.tsx`; route `apps/web/src/app/[locale]/(projector)/designs/[id]/versions/[versionId]/projector/page.tsx`; `apps/web/e2e/projector.spec.ts`; `docs/test-cases/ui/286-projector-view.md`; `docs/decisions/286-projector-view.md`.
Change: `features/projector/index.ts` (export `ProjectorScreen`), `features/pattern-versions/{model/version-input.ts,index.ts}`, `features/pattern-page/hooks/use-read-only-version.ts`, `ReadOnlyVersionBody.tsx`, `apps/web/messages/{ar,en}.json` (`projector.view.*`, `projector.help.*`, `projector.entry.*`), `docs/frontend/README.md`.

### Tests

- Unit `projector-view.test.ts`: with `kx=4, ky=4` a 100 mm point maps to 400 px; with `kx=4, ky=4.2` x and y differ; `patternTransform` string for a known box, view and viewport (exact expected string); mirror negates only the x scale and the verification square has the same rect with `mirror` true or false; `panBy` 1/10/50 mm; `screenDeltaToSceneMm({1,0}, true) = {-1,0}`; `stepMm` picks 1/10/50 (Alt wins over Shift); `clampLineWidth(0) = 1`, `(9) = 6`.
- Unit `keymap.test.ts`: every key in the help list maps to an action; `ArrowLeft`+Shift gives `pan -1, 0, 10`; unknown keys give null; layout independent (uses `code`).
- Component (server render): canvas has `data-piece-id` per piece, the verification square sits outside the transformed group, `dir="ltr"` on the canvas in `ar` and `en`, toolbar text Arabic in `ar`, the guard file test: `apps/web/src` has no import of engine geometry (existing static test continues to pass).
- E2E `projector.spec.ts` (desktop; `seedCalibration(page, { pxPerMmX: 4, pxPerMmY: 4 })`; `ar` and `en`): the verification square is 400 x 400 px (±1) and a piece group with `data-width-mm` is `4 x` that width (±1); ArrowRight moves the pattern right by 4 px and Shift by 40 px, also after pressing `M` (mirror flips the group but the square stays); drag pans; `?` opens help and Escape closes it; line width key changes `stroke-width`; no stored calibration redirects to calibrate; every action reachable without a mouse.
- Manual `docs/test-cases/ui/286-projector-view.md` TC-UI-286-01..05 (fullscreen on the projector, tape on the square, mirror, keyboard only, Arabic keyboard layout); #287 appends its cases. **Physical accuracy is #294.**

### Decisions (build writes `docs/decisions/286-projector-view.md`)

1. The canvas is SVG with mm to px by two stored factors; strokes use non-scaling-stroke in px so line width is exactly what the toolbar says.
2. Pan is kept in screen mm and arrows are physical; mirror only flips the pattern group, never the verification square or the toolbar.
3. Keys are bound by `event.code` so an Arabic keyboard layout works.
4. Line width and colour are saved per device; pan and mirror are not.
5. The version's scene comes from the worker run of its stored inputs; `versionPreviewInput` is shared with the read-only version screen.
6. Projector entry is disabled below `md` with a reason, not hidden.

### Risks

- Non-uniform scaling distorts text; labels are small and only a guide, accepted. Stroke weight is unaffected.
- A very large scene on a small calibrated screen overflows the viewport: pan reaches it; no auto-fit by design (1:1).
- Fullscreen state and the toolbar: the toolbar stays reachable by keyboard; Escape is native fullscreen exit, so it is not used for other actions except closing the help overlay.
- Worker run time for big dresses on low-end laptops: shown as a loading state; no new cost (same worker as the pattern page).

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). Label `needs:sew-test` stays: #294. `node scripts/needs-interactive.mjs` on the planned files: `no`.

## Deviations

- "Projector" entry is a new `UseVersionBar` ("Use this version", `pattern-versions/components/`) on the version view, as in `VersionView.dc.html`, instead of a `PageHeader` action; it has the projector button now and #288/#289 add theirs. Below `md` a disabled twin with the reason replaces the link.
- The canvas is an SVG inside a `dir="ltr"` div (SVG elements take no `dir`); the `data-width-mm` is on the cut path, so the e2e measures the cut line, not the notches.
- The toolbar is a bar over the top of the canvas (design aside panel holds piece, rotate and move controls that belong to #287); colour is white or yellow as in the issue.
- Line width/colour live in `model/prefs-store.ts` (`tafsila.projector.view`, schema in `projector.schema.ts`); the line width constants live in the schema file.
- Help rows list only the keys wired here (`HELP_ROWS` in `model/keymap.ts`); #287 adds its rows.
- `use-drag-pan.ts` hook added for the mouse drag; `components/link-button.ts` shares the link-button classes with the calibration view.
