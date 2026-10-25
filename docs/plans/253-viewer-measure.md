## Plan: #253 viewer measure tool (P3)

Plan wave M3, 2026-10-19. Depends on #248 (selection and the dev-route layout) and on the viewer contract from #243 (`ViewerMeasure`, `onMeasureChange`, `SnapPoint`, `measureBetween`). The measure props are already typed and inert in #243, so this issue changes no props. First issue to cut if M3 runs short (ADR-236 item 13).

### Approach

- `MeasureToggle` (button in the viewer controls, `aria-pressed`) sets `measure = { active: true, points: [] }`; Escape sets `active: false, points: []` (extend #243's key handler).
- Canvas in measure mode: a tap or click finds the nearest `SnapPoint` (vertices of the stitch path and notches from `scene.pieces[].snapPoints`) within `SNAP_RADIUS_PX = 16` screen px (named constant; 16 px is a comfortable finger target) via pure `nearestSnap(points, atMm, radiusMm)` in `model/measure.ts`; no snap means the tap is ignored. Pan and pinch keep working: a tap is a pointer down/up with movement under 6 px. First point is marked, second point draws a line and the label.
- Distance: `measureBetween(a.at, b.at)` from the engine (mm) shown in cm with one decimal in a readout `MeasureReadout` (`aria-live="polite"`) next to the line. A third tap starts a new measurement.
- Keyboard and screen-reader path: `MeasurePointList`, a list of all snap points (grouped by piece, label "piece name, notch/corner N") with two selection slots "from" and "to": choosing points calls `onMeasureChange` the same way as taps; the readout announces the result.
- Rendering: `components/MeasureLayer.tsx` is an SVG `<g>` inside `ViewerCanvas` (non-scaling strokes, token colours); it replaces nothing else. Snap points are only shown while `measure.active`.

### Files

Create in `apps/web/src/features/pattern-viewer/`: `model/measure.ts` (`nearestSnap`, `nextMeasure(state, snap)`), `components/MeasureLayer.tsx`, `components/MeasureToggle.tsx`, `components/MeasureReadout.tsx`, `components/MeasurePointList.tsx`, tests, `docs/test-cases/ui/253-viewer-measure.md`. Change: `ViewerCanvas.tsx` (mount layer, route taps), `ViewerControls.tsx` (toggle), `index.ts`, `messages/ar.json` and `en.json` (`patternViewer.measure.*`), dev route.

### Tests

- Unit: `nearestSnap` picks the closest within the radius and null outside; `nextMeasure` cycles empty, one, two, restart; two known points on a fixture piece (a rectangle piece or `seedDress` front corners with known edge length) give `measureBetween` = expected ± 0.1 cm (e.g. a known edge of 45.0 cm between its end vertices).
- Server-render: readout shows "12.3 cm" style text in `ar` digits and `en`; point list has one button per snap point; toggle has `aria-pressed`.
- E2E (dev route): in measure mode tap two vertices of a known edge and the readout equals the edge length in the panel (#248) ± 0.1 cm; Escape exits and clears; keyboard-only flow with the point list gives the same number; at the 360 px touch project (`hasTouch`) two taps measure and a drag still pans; `ar` and `en`.
- Visual: viewer with a measured line, `ar`, 360 px.
- Manual: TC-UI-253-01 (measure a printed piece against the screen number).

### Docs

`docs/frontend/README.md` viewer section; test case file. SRS FR-VIEW-03 stays priority S.

### Decisions (build writes `docs/decisions/253-measure-tool.md`)

1. Straight-line distance only between snap points (vertices and notches); free points and curve length are out of scope.
2. Snap radius 16 px and tap tolerance 6 px as named constants.
3. Distance comes from the engine `measureBetween`; the UI only formats mm to cm.
4. Keyboard path is a point list, not canvas cursor movement.

### Risks

- Tap versus drag on touch: the 6 px tolerance and the e2e drag-still-pans case cover it.
- Dense snap points on small pieces at low zoom: snapping works in screen px so zooming in resolves it; noted in the manual case.

**Size:** S (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no.

## Deviations

- The keyboard path is two native selects ("from", "to"; options grouped by piece) in `MeasurePointList`, not a list of buttons: fewer elements, same keyboard and screen-reader behaviour. "To" is disabled until "from" is chosen.
- The toggle lives in `ViewerControls` (the viewer toolbar); `PatternViewer` owns the tap routing, and the gesture hook's tap callback now also gets the tap position. No dev-host change: it already passes `measure`, and the real page's `ViewerPane` too.
- `MeasureToggle` is a button inside `ViewerControls`, not a separate component.
- No visual baselines (no Docker here): listed in the follow-up #265.
- E2E is one desktop spec (`pattern-viewer-measure.spec.ts`); the 360 px touch project is not extended (taps share the code path of the selection tap, covered by `pattern-viewer-touch.spec.ts`).
