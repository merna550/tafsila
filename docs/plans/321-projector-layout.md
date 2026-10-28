# Plan #321: Project the whole fabric layout

plan:sonnet · build:sonnet · size S (unchanged) · M5 wave 6 · FR-FAB-04, FR-PROJ-01..03 · ADR-286, ADR-287 (projector), ADR-312 item 9 (reuse the projector, rotation off), ADR-318 (the saved result keeps placements but not the drawing; the fabric worker builds the marker scene) · Screen: the projector screens of M4 (no new design; the layout reuses them)

### Approach

Add a "layout mode" to the existing projector instead of a new screen. Everything else (calibration, verification square, pan, mirror, fullscreen, keyboard help) stays as it is.

- **Entry:** a "Project the layout" button in the fabric calculator results (next to a fabric kind's length) links to `/designs/[id]/versions/[versionId]/projector?layout=<main|lining|interfacing>`. The button is disabled while there is no computed layout, with the standard reason text. The route and its page are unchanged except that they read the query parameter.
- **Scene source:** in layout mode the projector asks the nesting worker (`shared/fabric-nesting`, #318) for the marker scene of that kind with the options of the saved calculation (read through the existing `use-saved-fabric-calc` hook, falling back to the defaults if none is saved, and showing the "calculate first" message in that case). The worker drafts the pattern again from the version's stored inputs, as the calculator does. No scene is stored.
- **`ProjectorScreen`:** a `useProjectorScene(versionId)` sibling `useLayoutScene(versionId, kind)` (hooks) returns the same shape (`version, scene, failure, loading`) so `ProjectorStage` and `ProjectorCanvas` render a marker scene exactly as a pattern scene (both are drawn from scene pieces). The calculator and the projector share the options through the saved calc, not through React state.
- **Mode differences (all in `model/` as a small `ProjectorMode`):**
  - rotation controls hidden and rotation fixed at 0 (`PlacementControls`); the grain is already fixed by the layout (ADR-312 item 9);
  - the piece switcher (`PieceSwitcher`) is replaced by the kind label ("Main fabric, 1.3 m") since the whole marker is one scene; per-piece placement storage is skipped;
  - the fold line and the selvedge are drawn as extra marker lines (the marker scene from #316 carries them; `ProjectorCanvas` draws line items it does not know as plain strokes, otherwise add a tiny `kind: "fold" | "selvedge"` style);
  - pan covers the whole strip length: the pan bounds come from the scene bbox so a 3 m marker can be moved through, mirror still works; the view starts at the beginning of the strip (x = 0).
- **Calibration** is the stored per-device calibration (ADR-281 item 7) with no change; a missing calibration sends the user to `/projector/calibrate` as today and returns to the layout.
- **Messages:** `projector.layout.*` (button label, kind labels, "calculate first", "loading layout") in ar/en; the fabric calculator gets `fabric.calc.project`.

### Files

Create: `apps/web/src/features/projector/hooks/use-layout-scene.ts`, `model/projector-mode.ts`, and tests (`projector-layout.test.tsx`, `projector-mode.test.ts`); `apps/web/e2e/fabric-projector.spec.ts`; `docs/test-cases/ui/321-fabric-projector.md`; `docs/decisions/321-projector-layout-mode.md`; screenshots under `docs/test-cases/ui/screenshots/321/`.
Change: `ProjectorScreen.tsx`, `ProjectorStage.tsx`, `components/PlacementControls.tsx`, `components/PieceSwitcher.tsx` (hidden in layout mode), `ProjectorCanvas.tsx` (fold/selvedge strokes), the projector page (read `layout`), `features/fabric/components/FabricResults.tsx` (the button, as a link built by a helper in the projector feature's `index.ts`), `messages/{ar,en}.json`, `docs/frontend/README.md`, `docs/CONTEXT_MAP.md`, glossary, learning log.

No API, schema or engine change. The bundle guard from #318 must still pass: the projector page may import only the worker client, never `@tafsila/nesting`.

### Test plan

- **Model unit:** `projector-mode` returns rotation off and switcher hidden for `layout`, unchanged behaviour for pattern mode; pan bounds for a 3000 mm strip allow reaching the far end and no further.
- **Component:** layout mode hides the rotation controls and the piece switcher; shows the kind label; shows "calculate first" when no calculation exists; shows the fold and selvedge strokes (SVG markup contains the two line classes); pattern mode is unchanged (existing tests stay green).
- **Hook unit:** with a fake fabric client, `useLayoutScene` returns loading, then the scene; a worker error maps to `failure`.
- **E2E (ar-desktop; en smoke):** sign up, save a version, open it, calculate 140 cm folded, click "Project the layout", pass the (stored) calibration step by seeding `localStorage` with the same key the projector e2e uses, and see the marker scene with the fold line; pan to the far end with the keyboard; the rotation controls are absent.
- **Screenshots:** the projector in layout mode, ar/en, desktop (the projector is a fullscreen tool; mobile is one shot).
- Manual test cases (draft): TC-UI-321-01 project the main layout of a dress; 02 the lining layout; 03 verification square still correct; 04 pan to the end of a 2 m strip; 05 mirror; 06 no calibration redirects and returns; 07 physical check on a table with a projector (Merna, not part of the exit: the exit physical check is #322).

### Decisions to log (`docs/decisions/321-projector-layout-mode.md`)

1. Layout mode is a query parameter on the existing projector route, not a new route.
2. The scene is rebuilt by the nesting worker from the saved options; nothing new is stored.
3. Rotation is off and the piece switcher is replaced by the kind label in layout mode.
4. Pan bounds come from the scene bbox.

None is costly to reverse.

### Risks

- **Large marker redraw cost** on the projector canvas: the scene is the same primitive the pattern scene uses; one E2E case with the longest fixture marker guards responsiveness.
- **Calibration accuracy over long strips** is physical; Merna can try it with #294's projector but it is not an exit criterion.
- **Touching shared projector files:** merge main before the PR; existing projector tests must stay unchanged and green.

### Labels and needs

Size S, `plan:sonnet`, `build:sonnet` stay. `node scripts/needs-interactive.mjs` on the files above: `no`.

---

_Generated by [Claude Code](https://claude.ai/code)_

## Deviations

- Layout mode is a separate `LayoutProjector` beside `PatternProjector`, both over a shared `ProjectorFrame` (hooks cannot be switched inside one component); `ProjectorScreen` picks one.
- No separate `ProjectorMode` object: the mode is the optional `layout` kind; the pure helpers are in `model/projector-mode.ts` (`markerToScene`, `clampPan`, `startPan`, `layoutPieces`).
- `PlacementControls` is not reused in layout mode (it is only rotate and reset); the layout panel has the kind label and a "Back to the start" button.
- The calibration page keeps `?layout=<kind>` so the user returns to the layout.
- No hook unit test (the repo has no `renderHook` setup); the hook logic is in pure helpers with unit tests and the e2e spec covers the flow.
- Screenshots are not committed: this session has no Docker or API to produce a saved version; they come from the CI e2e run.
