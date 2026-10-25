<!-- Approved plan comment of #287 -->

## Plan: #287 projector one piece or full layout, move and rotate 0/180

Plan wave M4, 2026-10-25. Planned with #285 and #286; builds on `features/projector/` from #286 (`ProjectorCanvas`, `keymap`, `ProjectorView`, `screenDeltaToSceneMm`, `model/placement.ts` identity part). The build must match the projector screen in `docs/design/screens/` once #281 lands (piece list placement, rotate button); names below are fixed. Depends on #286.

### Approach

State = which pieces are shown, where each piece sits relative to the scene layout, and which piece the keys move. Nothing touches the engine scene or the server.

Pure model, extending `features/projector/model/placement.ts` (#286 created `Placement`, `Placements`, `IDENTITY_PLACEMENT`, `placementTransform`):

```ts
export type Rotation = 0 | 180;
export type Placement = { dxMm: number; dyMm: number; rotation: Rotation };      // offset from the scene layout, in scene mm
export type Placements = Readonly<Record<string, Placement>>;                   // by piece id; absent = identity
export type PieceSelection = "all" | string;                                    // piece id for single-piece mode
export type PlacementState = { selection: PieceSelection; activePieceId: string | null; placements: Placements };
rotate180(p: Placement): Placement                          // 0 <-> 180, only these two exist
movePiece(state, pieceId, screenDeltaMm: Point, mirror: boolean): PlacementState   // uses screenDeltaToSceneMm from #286; adds to dx/dy
resetPlacements(): PlacementState                           // identity, selection "all"
centreOnPiece(scene, placements, pieceId, calibration, viewport): Point            // panMm that puts the placed piece box centre at the viewport centre
visiblePieceIds(scene, selection): readonly string[] | "all"
pruneToScene(state, scene): PlacementState                  // drops ids no longer in the scene (engine changed)
nextPieceId(scene, current, step: 1 | -1): string           // wraps around
placementTransform(piece, placement): string               // "translate(dx dy) rotate(180 cx cy)" about the cut-box centre; "" for identity
```

Rotation is about the centre of the piece's cut box so size and place stay (a moved piece keeps its size in mm; the grain line rotates with the piece and stays parallel to the fabric grain). No function can produce another angle: the type is `0 | 180` and `rotate180` is the only rotation.

Single-piece mode: choosing a piece sets `selection = id`, `activePieceId = id` and sets the view pan with `centreOnPiece` once (an action, not continuous), so later moves are visible. Arrow keys (same steps as pan: 1, Shift 10, Alt 50 mm) **move the active piece when there is one, else pan the view**; in "all" mode a pointer press on a piece makes it active and dragging moves it, dragging empty canvas pans; Escape clears the active piece (the help overlay still closes first). `R` rotates the active piece (needs an active piece; the button is disabled without one). Reset button / `Digit0`: `resetPlacements()` and pan back to the default.

Persistence: `tafsila.projector.placement.<versionId>` (`{ version: 1, selection, placements }`; `activePieceId` is not saved), `readJson`/`writeJson` with the schema in `projector.schema.ts`, `pruneToScene` on read. Per viewer and per version; nothing is sent to the server.

Components (`features/projector/components/`): `PieceSwitcher.tsx` (panel with "All pieces" and one row per piece with its localized name, `aria-current` on the chosen one, Previous/Next buttons; toggled with `L`, `PageUp/PageDown` step, `A` = all), `PlacementControls.tsx` (Rotate 180° and Reset buttons with key hints). `hooks/use-placements.ts` returns `{ state, selectPiece, setActive, move, rotateActive, reset }` and owns persistence. `ProjectorScreen` wires them; `ProjectorCanvas` already takes `visiblePieceIds`, `placements`, `activePieceId`, `onPiecePointerDown` from #286 (no signature change; active piece gets `data-active`, drawn with the highlight colour).

### Files

Create in `features/projector/`: `components/PieceSwitcher.tsx`, `components/PlacementControls.tsx`, `hooks/use-placements.ts`, `model/placement.test.ts`, `components/placement.test.tsx`; `docs/decisions/287-projector-pieces.md`.
Change: `model/placement.ts`, `model/keymap.ts` (nothing new: the `rotate`, `reset`, `nextPiece`, `prevPiece`, `allPieces`, `pieces` actions already exist from #286), `components/ProjectorScreen.tsx`, `components/ProjectorToolbar.tsx`, `components/KeyboardHelp.tsx` (add the new keys), `projector.schema.ts`, `apps/web/messages/{ar,en}.json` (`projector.pieces.*`), `apps/web/e2e/projector.spec.ts` (extend), `docs/test-cases/ui/286-projector-view.md` (append TC-UI-287-01..04, as the issue says), `docs/frontend/README.md` (Projector section).

### Tests

- Unit `placement.test.ts`: `rotate180` twice returns the start; no input gives a rotation other than 0 or 180 (property test over random move/rotate sequences with fast-check if `apps/web` already uses it, else a loop over 200 random seeds); `movePiece` changes only dx/dy and the piece's `bboxMm` (read from the scene) is unchanged; with `mirror: true` a screen move of +10 mm in x gives `dxMm = -10`; `resetPlacements` equals the initial state; `placementTransform` identity is `""` and 180 rotates about the box centre (exact string); `centreOnPiece` puts the placed box centre at the viewport centre for 4 px/mm; `visiblePieceIds` for "all" and one id; `pruneToScene` drops unknown ids; `nextPieceId` wraps.
- Component (server render): the switcher lists every scene piece in `ar` and `en`; the chosen row has `aria-current`; Rotate is disabled without an active piece.
- E2E `projector.spec.ts` (`seedCalibration` 4 px/mm; `ar` and `en`): pick one piece (only that `data-piece-id` is drawn, centred ±1 px), press `R` (the group's bounding box centre stays, `data-rotation="180"`), press ArrowRight with Shift (moves 40 px), the verification square rect is identical before and after, Reset restores the first positions, reload keeps the placement for this version and not for another version; storage blocked: everything works, nothing persists.
- Manual: TC-UI-287-01..04 appended to `docs/test-cases/ui/286-projector-view.md` (one piece on the table, rotate to fit the fabric, move by keys, reset).

### Decisions (build writes `docs/decisions/287-projector-pieces.md`)

1. Placement is an offset from the scene layout in scene mm plus `0 | 180`; single-piece mode only filters and centres once, so the same numbers mean the same thing in both modes.
2. Arrow keys move the active piece, otherwise pan; drag on a piece moves it, drag on empty canvas pans.
3. Rotation is about the piece's cut-box centre and is a type-level `0 | 180`.
4. Placements are saved per viewer and version under `tafsila.projector.placement.<versionId>` and pruned when pieces no longer exist; the active piece is not saved.

### Risks

- Moved pieces can overlap or leave the screen: allowed (it is a physical fitting aid); Reset is one click.
- Pieces with `cut.count > 1` (pairs) are one scene piece, so one placement covers the drawn piece; mirrored pairs stay M5 (fabric layout) and out of scope.
- Mirror and move direction: covered by the `screenDeltaToSceneMm` unit and e2e checks.
- Persisted placement after an engine change: `pruneToScene` plus the ordinary default for new pieces.

**Size:** S (unchanged). **Build:** `build:sonnet` (unchanged). `node scripts/needs-interactive.mjs` on the planned files: `no`.

### Deviations

- `model/placement.ts` from #286 already had `Placement = { offsetMm, rotationDeg }`; kept those names (rotation narrowed to `0 | 180`) instead of `dxMm/dyMm/rotation`.
- `centreOnPiece(scene, placements, pieceId, mirror)` has no calibration or viewport: the pan is in screen mm, so the px factors cancel.
- `nextPieceId` and `usePlacements().neighbour` return `string | null` (empty scene).
- `Escape` is a keymap action (`clearActive`); `rotatePiece` and `placement-store.ts` were added; the piece controller type lives in `model/controllers.ts` and `use-projector-pieces.ts` joins the pieces with the view.
- The piece list panel is open by default (as in the screen) and toggled with `L`; the arrow pad of the screen is not built (arrow keys do it).
- E2E checks "not for another version" only in the unit test of the store key; `data-rotation` is not added (the e2e reads the `rotate(180 ...)` transform).
