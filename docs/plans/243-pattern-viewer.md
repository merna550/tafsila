# Plan: #243 pattern viewer

## #243 pattern viewer with zoom, pan and fit (and the shared viewer contract for #248, #249, #253)

Plan wave M3, 2026-10-19. Depends on #236 (screens). Planned together with #248, #249, #253: this issue owns the component, the state hook and the props, so the other three only add UI on top and do not edit each other's files. The build must match the pattern-page screen in `docs/design/screens/` once #236 lands (colours, control placement, panel layout); the interfaces below are fixed so the build does not guess.

### Finding that shapes the plan

`renderSvg` returns one text for a whole sheet with no per-edge elements and no `data-` attributes, and `web` Vitest has **no DOM** (server-render tests only, `vitest.config.ts`). So: (1) the engine gets a pure "scene" function the viewer draws from; (2) gesture logic lives in pure functions tested in Vitest, and real touch/keyboard behaviour is tested in Playwright.

### Approach

1. **Engine, `packages/engine/src/render/scene.ts`** (exported from `render/index.ts`): `buildPatternScene(result: PatternResult): PatternScene`, pure and JSON-serialisable, built on `layoutSheet` and `pathData`. To avoid duplicating `layers.ts`, extract the notch-tick, dart-leg and label-anchor point helpers there into exported functions used by both; the `renderSvg` snapshots must stay byte-identical (the test proves no duplication).
   ```ts
   PatternScene = { widthMm, heightMm, pieces: ScenePiece[] }
   ScenePiece = { id, name: LocalizedText, cut: Piece["cut"], bboxMm: {widthMm,heightMm}, offset: Point,
     cutD, stitchD, grainD, edges: SceneEdge[], notches: {id, edgeId, d, at: Point}[],
     darts: {id, d}[], labels: {id, text: LocalizedText, at: Point, sizeMm}[], snapPoints: SnapPoint[] }
   SceneEdge = { id, d, kind?, lengthMm, seamAllowanceMm }   // lengthMm = edgeLengthMm()
   SnapPoint = { id, pieceId, at: Point /* sheet mm */, kind: "vertex" | "notch" }
   ```
   Also `resolveRef(scene, ref: string): ViewerTarget | null` (parses the validation `refs` strings: `pieceId`, `pieceId/dartId`, `pieceId/edgeId`) and `measureBetween(a: Point, b: Point): number` (mm, wraps `distance`). `ViewerTarget = { pieceId: string; edgeId?: string; dartId?: string }`.
2. **Worker (#239) returns the scene.** The response in `shared/pattern-preview/protocol.ts` gains `scene: PatternScene` next to `result` (the worker calls `buildPatternScene`), so no geometry code reaches the main bundle (#239 bundle guard). #243 makes this one-line change in `worker.ts` and `protocol.ts` and updates their tests. `measureBetween` and `resolveRef` are tiny and imported on the main thread; they must not contain the guard marker.
3. **Feature `apps/web/src/features/pattern-viewer/`** (layers: components → hooks → model):
   - `model/types.ts`: the contract below. `model/viewport.ts`: pure `fitViewport`, `zoomAt(vp, factor, anchor)`, `panBy`, `pinch(prevTouches, nextTouches)`, `clampZoom`, `focusViewport(sceneBox, targets)`, `ZOOM_MIN/ZOOM_MAX` (named constants with reasons), `mmPerPx`. `model/scene-selectors.ts`: `targetBox(scene, targets)`.
   - `hooks/use-viewport-gestures.ts`: Pointer Events only (one code path for mouse and touch): drag = pan, wheel = zoom at cursor, two pointers = pinch + pan, keyboard (arrows pan, `+`/`-` zoom, `0` fit). `touch-action: none` on the canvas; a ResizeObserver refits on first layout and on container resize until the user has moved.
   - `hooks/use-viewer-state.ts`: `useViewerState(): ViewerController` (plain React state, no new dependency; the Zustand line in `docs/frontend/README.md` stays for the editor store of #244). Layers persist per viewer in `localStorage` (`tafsila.viewer.layers`, try/catch, defaults when blocked).
   - `components/PatternViewer.tsx` (forwardRef, controlled), `ViewerCanvas.tsx` (the `<svg>`), `ViewerControls.tsx` (zoom in/out, fit, 1:1 cm indicator: a bar of 10 cm at current zoom, never mirrored), `index.ts` (public API: `PatternViewer`, `useViewerState`, the types).
   - Drawing: one `<g data-piece-id>` per piece, `<path data-edge-id>` per edge over a stitch path (transparent wide stroke for hit testing, `vector-effect: non-scaling-stroke` so lines stay thin at any zoom), cut path, grain, notches, darts, labels. Units mm, `viewBox` from the scene. The wrapper is `dir="ltr"` so the canvas never mirrors; labels keep the engine's `direction="rtl"` text attributes. Only controls follow the locale.
4. **Messages** `patternViewer.*` in `apps/web/messages/ar.json` and `en.json` (zoom in/out, fit, scale bar, canvas `aria-label`, keyboard help), copy per `docs/design/copy.md`.
5. **Dev host** `apps/web/src/app/[locale]/dev/pattern-viewer/page.tsx`, same dev-only guard as #239's `dev/pattern-preview` (reuse whatever #239 settled on); runs the preview hook on `seedDress` M and mounts the viewer. #251 moves the e2e to the real page and deletes the route.

### The contract (fixed; #248, #249, #253 use it as is)

```ts
type ViewerLayers = { cut: boolean; stitch: boolean; notches: boolean; labels: boolean; grid: boolean }; // defaults: all true except grid
type ViewerMeasure = { active: boolean; points: SnapPoint[] }; // 0..2 points
type PatternViewerProps = {
  scene: PatternScene;
  layers: ViewerLayers; // #243 applies them; #248 adds the toggles UI
  selectedPieceId: string | null;
  onSelectPiece: (id: string | null) => void; // click/tap on a piece, Escape, click on empty canvas
  highlight: ViewerTarget[]; // pieces/edges/darts drawn in the highlight style (#249)
  measure: ViewerMeasure; // #253; with active=false the canvas ignores it
  onMeasureChange: (m: ViewerMeasure) => void;
  className?: string;
};
type PatternViewerHandle = { fit(): void; zoomTo(targets: ViewerTarget[]): void }; // via ref; viewport (zoom/pan) stays inside the viewer
type ViewerController = {
  layers;
  setLayers;
  toggleLayer;
  selectedPieceId;
  selectPiece;
  highlight;
  setHighlight;
  measure;
  setMeasure;
  ref;
};
```

Selected and highlighted pieces get `data-selected` / `data-highlighted` attributes and styles from design tokens (no raw colours; `packages/ui` tokens only). #243 implements layers, selection (pointer + Escape) and highlight rendering and `zoomTo`; measure props are typed and inert until #253. The page (#251) owns one `useViewerState()` and passes pieces of it to `PatternViewer`, `PiecePanel`, `ValidationReport`.

### Tests

- Unit (engine): `buildPatternScene(seedDress)` has one `ScenePiece` per piece, edge `lengthMm` equals `edgeLengthMm`, snap points include every notch, scene is `JSON.parse(JSON.stringify())` stable; `renderSvg` snapshots unchanged; `resolveRef` resolves every `refs` string in all seed reports (and returns null for junk); `measureBetween((0,0),(30,40)) = 50`.
- Unit (web, pure): `fitViewport` fits any scene into 360x640 and 1280x800 with margin; `zoomAt` keeps the anchor fixed; zoom clamps at `ZOOM_MIN/MAX`; `panBy`; `pinch` doubles zoom when fingers move apart 2x and pans with the midpoint; `focusViewport` frames targets.
- Server-render (existing style): markup has `data-piece-id` for every piece and `data-edge-id` for every edge; layers off remove their groups; the wrapper has `dir="ltr"` in both `ar` and `en`; controls text is Arabic in `ar`.
- E2E Playwright on the dev route (desktop project, `ar` and `en`): wheel zoom grows the scale bar and stops at the limit; drag pans; fit button restores the fit; arrow keys pan the canvas in physical directions (ArrowLeft moves content left) in both `ar` (RTL) and `en`; the canvas is not mirrored in `ar` (a piece's x order equals `en`).
- **E2E touch** (new Playwright project `mobile-360`: viewport 360x740, `hasTouch`, `isMobile`): two-finger pinch out (dispatch two `pointerType: "touch"` pointer streams, or CDP `Input.dispatchTouchEvent`) zooms in; one-finger drag pans; the page itself does not scroll while the canvas is dragged; no horizontal page overflow at 360 px; tap selects a piece. Run in `ar`.
- Visual: Playwright screenshot of `seedDress` M in the viewer, `ar`, desktop and 360 px, stored with the existing snapshot setup.
- Static: dependency-cruiser keeps `apps/web` free of geometry imports (only `import type` from the engine plus `resolveRef`/`measureBetween`); a grep-style test fails if `apps/web/src` imports `@tafsila/engine/geometry` or `samplePath`.
- Manual cases `docs/test-cases/ui/243-pattern-viewer.md` TC-UI-243-01..04 (pinch on a real phone, trackpad, keyboard, RTL).

### Docs

`docs/frontend/README.md` (section "Pattern viewer": contract, controlled model, no mirroring), `docs/CONTEXT_MAP.md` (row for viewer work), `docs/engine/README.md` (scene function), JSDoc on every function and type (rule 3). No SRS or API change.

### Decisions (build writes `docs/decisions/243-viewer-contract.md`)

1. The viewer draws from an engine `PatternScene` built in the worker; the UI never computes geometry.
2. Domain state (layers, selection, highlight, measure) is controlled by props; viewport (zoom/pan) is internal and driven through a ref handle (`fit`, `zoomTo`).
3. Pointer Events for mouse, touch and pen; pinch via two pointers.
4. Canvas is `dir="ltr"` and never mirrors; only controls follow the locale; keyboard arrows are physical.
5. State hook is plain React (no Zustand yet); layers persist in `localStorage` only as a per-viewer convenience.
6. Gesture maths are pure functions in `model/`; real gestures are covered by Playwright because web unit tests have no DOM.

### Risks

- Extracting helpers from `layers.ts` could change SVG output: guarded by the existing byte snapshots.
- Pinch synthesis in Playwright is fiddly: use CDP touch events; if flaky twice, keep the pure `pinch` unit tests plus a manual case and say so in the PR.
- Large scenes (many hit-test paths) at 360 px: edges carry one path each; measure render time on the seed dress, record in the PR.
- #236 not merged yet: the build starts only after it and aligns spacing, icons and control placement with `docs/design/screens/`.

**Size:** M (unchanged; touches engine, worker and web). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no (script says `no` for the planned files).

## Deviations

- The canvas is one `<svg width="100%" height="100%">` with a `<g transform="translate scale">` in mm (not a `viewBox`), so the viewport maths stay in pixels and `non-scaling-stroke` keeps lines thin; the group is still in sheet mm.
- `ScenePiece` also carries `cell` (top-left of the cut box on the sheet, used to frame a piece) and each label carries `rotationDeg`.
- The scene types, `resolveRef` and `measureBetween` live in `packages/engine/src/render/scene-queries.ts`, exported as the subpath `@tafsila/engine/viewer` (no drafting code), so the main bundle never loads the engine entry. `measureBetween` uses `Math.hypot`, not the geometry kit.
- `resolveRef` also maps `pieceId/body-line:<id>` to the piece and `pieceId/<edgeId>#<part>` to the edge. A few rules still name pieces by block id (`front/waist`); those name nothing on the sheet and resolve to `null`.
- Layer mapping: `cut` = cut line, `stitch` = stitch line and edges, `notches` = notches, darts and grain line, `labels` = names, `grid` = background grid.
- The visual baseline (Storybook/Playwright snapshot of the seed dress, `ar`, desktop and 360 px) is not added: no Docker here, so baselines would drift from CI. Moved to the follow-up #265.
- Pinch is tested with CDP touch events in the new `mobile-360` project (one spec, `pattern-viewer-touch.spec.ts`); the other projects ignore it.
