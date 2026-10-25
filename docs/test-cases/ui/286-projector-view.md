# Test cases - Projector view

| Field        | Value                                                  |
| ------------ | ------------------------------------------------------ |
| Issue        | #286, #287                                             |
| SRS          | FR-PROJ-01, FR-PROJ-03, FR-PROJ-04, FR-PROJ-05, NFR-07 |
| Area         | ui                                                     |
| Last updated | 2026-10-25 (by the PR of #286)                         |

## Test data

A signed-in user with a saved version of a dress and a calibrated device (see `285-projector-calibration.md`). A projector over a cutting table and a tape measure for the physical cases. **Physical accuracy (at most 2 mm over 50 cm at 4 positions) is checked in #294, not here.** #287 appends its cases (one piece, move, rotate).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                           | Priority | Preconditions          | Steps                                                                                  | Expected result                                                                                                                          | Automated by                                                           | dev | staging |
| ------------ | ------------------------------- | -------- | ---------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --- | ------- |
| TC-UI-286-01 | Fullscreen on the projector     | High     | Calibrated, projector  | 1. Open the version, press "View with projector". 2. Press F or the Fullscreen button. | Black page with the pattern lines, the verification square at the bottom start corner, no scrollbars.                                    | `e2e/projector.spec.ts` (square, scale)                                | ⬜  | ⬜      |
| TC-UI-286-02 | Tape on the verification square | High     | Projector on the table | 1. Measure the square with a tape.                                                     | 10 cm in both directions (physical limit: #294).                                                                                         | manual only                                                            | ⬜  | ⬜      |
| TC-UI-286-03 | Mirror                          | High     | Pattern shown          | 1. Press M.                                                                            | The pattern flips left to right, the square and the toolbar stay; arrow keys still move what you see.                                    | `e2e/projector.spec.ts` (mirror)                                       | ⬜  | ⬜      |
| TC-UI-286-04 | Keyboard only                   | High     | Pattern shown          | 1. Tab through the toolbar. 2. Use arrows, Shift and Alt arrows, [ ], ?, Esc.          | Every action works without a mouse; pan 1, 10, 50 mm; the help opens and Esc closes it.                                                  | `e2e/projector.spec.ts` (keys, help)                                   | ⬜  | ⬜      |
| TC-UI-286-05 | Arabic keyboard layout          | High     | Keyboard set to Arabic | 1. Press the keys marked M, F, [ and ? (Shift + the slash key).                        | Same actions as on a Latin layout.                                                                                                       | `keymap.test.ts`                                                       | ⬜  | ⬜      |
| TC-UI-286-06 | Drag pans the pattern           | Medium   | Pattern shown          | 1. Drag with the mouse.                                                                | The pattern follows the pointer 1:1 in mm.                                                                                               | `e2e/projector.spec.ts` (drag)                                         | ⬜  | ⬜      |
| TC-UI-286-07 | Line width and colour kept      | Medium   | Pattern shown          | 1. Set width 4 and yellow. 2. Reload.                                                  | Width and colour are kept; pan and mirror are reset.                                                                                     | `prefs-store.test.ts`                                                  | ⬜  | ⬜      |
| TC-UI-286-08 | Not calibrated                  | High     | No stored calibration  | 1. Open the projector URL.                                                             | Redirect to the calibration page.                                                                                                        | `e2e/projector.spec.ts` (redirect)                                     | ⬜  | ⬜      |
| TC-UI-286-09 | Phone width                     | Medium   | 390 px wide            | 1. Open the version view.                                                              | The projector button is disabled and the reason text is shown.                                                                           | `projector.test.tsx`                                                   | ⬜  | ⬜      |
| TC-UI-286-10 | Arabic and English pages        | Medium   | Both languages         | 1. Open the projector in each language.                                                | Controls follow the language; the canvas stays left to right.                                                                            | `e2e/projector.spec.ts`, `projector.test.tsx`                          | ⬜  | ⬜      |
| TC-UI-287-01 | One piece on the table          | High     | Pattern shown          | 1. Choose one piece in the list. 2. Choose "All pieces".                               | Only that piece is drawn, centred; all pieces return with the layout.                                                                    | `e2e/projector.spec.ts` (pieces), `placement.test.tsx`                 | ⬜  | ⬜      |
| TC-UI-287-02 | Rotate to fit the fabric        | High     | One piece chosen       | 1. Press R or the Rotate 180° button. 2. Press it again.                               | The piece turns half a turn about its centre, same size, grain line turns with it; the second press restores it; no other angle exists.  | `e2e/projector.spec.ts` (pieces), `placement.test.ts`                  | ⬜  | ⬜      |
| TC-UI-287-03 | Move by keys and drag           | High     | A piece is active      | 1. Press arrows, Shift and Alt arrows. 2. Drag the piece. 3. Drag empty canvas.        | The piece moves 1, 10, 50 mm; drag moves it 1:1; empty canvas pans; the verification square never moves; mirrored, right is still right. | `e2e/projector.spec.ts` (pieces), `placement.test.ts`                  | ⬜  | ⬜      |
| TC-UI-287-04 | Reset and keep                  | Medium   | Pieces moved           | 1. Reload. 2. Press 0 or Reset. 3. Open another version.                               | After reload the placement is kept for this version only; reset restores the layout; storage refused: it works and nothing is kept.      | `e2e/projector.spec.ts` (pieces, blocked storage), `placement.test.ts` | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
