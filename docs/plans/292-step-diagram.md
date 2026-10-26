## Plan: #292 direct-cut step diagram with the current point highlighted (planned together with #291, the checklist)

Plan wave M4, 2026-10-25. Depends on #291 (read its plan comment first: `CutPlan` contract, files, tick keys). **The build must match the direct-cut screen from #281 in `docs/design/screens/` (highlight colour, dimming, guide labels, diagram placement at 360 px).** P3, cut first if time runs short.

### Approach

#291 already creates `PieceDiagram` and the `CutStep.pointIds` / `guides` data, drawing every point equally. This issue adds the "current step" behaviour on top, without touching the worker or the data contract:

1. **Current step** (pure, `model/current-step.ts`): `currentStepId(steps, ticked, tappedId)` = the tapped step if it still exists, else the first unticked step, else `null` (all done). `StepRow` body tap and keyboard focus call `onSelect(stepId)`; ticking a step clears the tapped id so the current one moves to the next unticked. State lives in `DirectCutScreen` through `hooks/use-current-step.ts` (plain `useState`), reset when the chosen piece changes.
2. **Highlight** in `PieceDiagram({ plan: CutPiecePlan, activeStep?: CutStep | null, locale, digits })`: without `activeStep` the drawing is as #291 left it (all points normal). With it: points in `activeStep.pointIds` are drawn large with `data-current="true"` (and their letters bold), all other points get `data-dimmed="true"` (token opacity, not a raw value), and each `activeStep.guides` entry is drawn as a dashed segment with its length label `formatCm(mm)` run through `localizeDigits` (the engine supplies the segments; the UI never computes a foot of a perpendicular or a distance). Every point is drawn with `data-point-id`, every guide with `data-guide`. The diagram wrapper is `dir="ltr"` and never mirrors (same rule as the viewer); labels stay readable at 360 px (minimum text size from the design). SVG `viewBox` from `diagram.widthMm/heightMm`; stroke widths use `vector-effect: non-scaling-stroke`.
3. **Phone layout:** the diagram sits sticky under the header on 360 px (height from the design) so the highlight stays visible while the list scrolls; the design decides the exact size.
4. **Print** (same data): `PrintSheet` shows, per piece, one small `PieceDiagram` per step group (`corners`, `curves`, `marks`): the group's steps list their points all highlighted (`activeStep` is replaced by a group view: prop `activePointIds` + `guides` for the group, so `PieceDiagram` takes `highlight?: { pointIds: string[]; guides: Guide[] }` and `activeStep` is turned into it by a pure helper `highlightOf(step | group)` in `model/steps.ts`). Keeps pages short: 3 diagrams at most per piece instead of one per step.

### Files

Create: `apps/web/src/features/direct-cut/model/current-step.ts` + test; `hooks/use-current-step.ts`; `components/PieceDiagram.test.tsx`; `docs/decisions/292-step-diagram.md`.
Change (all created by #291): `components/PieceDiagram.tsx`, `StepRow.tsx`, `StepList.tsx`, `PrintSheet.tsx`, `DirectCutScreen.tsx`, `model/steps.ts` (+ test: `highlightOf`), `apps/web/messages/{ar,en}.json` (`directCut.diagram.*`: aria-label "Point A on the piece", legend), `apps/web/e2e/direct-cut.spec.ts`, `docs/test-cases/ui/291-direct-cut.md` (new cases), `docs/frontend/README.md` ("Direct cut" paragraph). No SRS, API, engine or worker change.

### Tests

- Unit: `currentStepId` – first unticked when nothing tapped; tapped wins; tapped id missing from the list is ignored; all ticked gives `null`; ticking the tapped step moves on. `highlightOf` for a step and for a group returns the union of point ids and guides.
- Component (server render + fixture plan from #291, `ar` and `en`): with `activeStep` for point "B" the markup has `data-current` on `[data-point-id="B"]` only, all others `data-dimmed`, guides rendered with Western-digit cm labels; without `activeStep` nothing is dimmed. Tapping a step is covered in Playwright (web unit tests have no DOM, see the #243 plan): a Playwright component-style check in the e2e below.
- **E2E** (extends `direct-cut.spec.ts`; `ar`, desktop and `mobile-360`): on the seed dress, tapping step 3 makes its point `data-current` and the previous current one dimmed; ticking step 1 moves the current to step 2 when nothing was tapped; keyboard Tab to a row makes it current; the highlighted point is inside the visible part of the screen at 360 px while the list is scrolled to the bottom.
- Screenshots: highlighted step at 360 px and at desktop, `ar` (RTL), compared with the #281 images; print snapshot (from #291) updated with the group diagrams, one page per piece, still within the page.
- Manual: add TC-UI-292-01 highlight follows the tapped step; -02 print shows 3 small diagrams per piece; -03 Arabic 360 px; all in `docs/test-cases/ui/291-direct-cut.md`.

### Decisions (build writes `docs/decisions/292-step-diagram.md`)

1. Current step = tapped step, otherwise the first unticked one; ticking clears the tap.
2. The engine supplies the guide segments (`CutStep.guides`); the UI draws them and prints their length, so no geometry in `apps/web`.
3. Print shows one diagram per step group (corners, curves, marks) instead of one per step.
4. The diagram never mirrors in RTL (same rule as the pattern viewer, ADR-243); only its labels and the surrounding screen follow the locale.

### Risks

- The highlight needs `pointIds` and `guides` from #284/#291's adapter; if the engine cannot supply `guides`, #291 already stops (`status:blocked`) and this issue waits.
- Small diagram at 360 px hides detail: screenshots at 360 px are in the acceptance tests, and the sticky size follows the design.
- P3: if time runs short, #291 ships alone (the drawing then shows all points normally) and this issue stays open.

**Size:** S (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no (script says `no` for the planned files).

## Deviations

- `guides` and `group` are added to `CutPlanStep` in the worker adapter (#291 left them out); guides are the two distances of each marked point (from the reference line and from the top line).
- `PieceDiagram` takes `highlight`, `locale` and `digits`; `formatCm` is in `model/format.ts`. State lives in `PieceWorkspace` via `useCurrentStep`, not `DirectCutScreen` (the piece is chosen there).
- `StepRow` selects on click and focus of the row; the tapped id needs no reset on piece change because step ids include the piece id.
- No visual baselines (no Docker); the visual check is listed on #265.
