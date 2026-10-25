# Test cases - Projector calibration

| Field        | Value                          |
| ------------ | ------------------------------ |
| Issue        | #285                           |
| SRS          | FR-PROJ-02, NFR-01, NFR-07     |
| Area         | ui                             |
| Last updated | 2026-10-25 (by the PR of #285) |

## Test data

A signed-in user with a saved version of a dress (open it from the version history, then go to `.../projector/calibrate`). A projector over a cutting table and a tape measure for the physical cases. **Physical accuracy (at most 2 mm over 50 cm) is checked in #294, not here.**

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                  | Priority | Preconditions                       | Steps                                                                                                           | Expected result                                                                                                   | Automated by                                               | dev | staging |
| ------------ | -------------------------------------- | -------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --- | ------- |
| TC-UI-285-01 | Happy path: factors from two sizes     | High     | Saved version                       | 1. Open the calibration page. 2. Type 600.5 and 590,25. 3. Press Enter.                                         | "Calibration done" with two factors; the stored entry holds square/600.5 and square/590.25.                       | `e2e/projector-calibration.spec.ts`, `calibration.test.ts` | ⬜  | ⬜      |
| TC-UI-285-02 | Square looks square on a projector     | High     | Projector, full screen              | 1. Show the page fullscreen with the projector. 2. Measure width and height with a tape. 3. Type them.          | The square is fully visible; unequal width and height give different X and Y factors.                             | manual only                                                | ⬜  | ⬜      |
| TC-UI-285-03 | Refused sizes                          | High     | Calibration page                    | 1. Type 20 and abc. 2. Press Calculate.                                                                         | Under the fields: "Enter a size between 50 and 5000 mm." and "Enter a number greater than zero."; nothing stored. | `e2e/projector-calibration.spec.ts`, `calibration.test.ts` | ⬜  | ⬜      |
| TC-UI-285-04 | Another screen asks to calibrate again | High     | Calibrated on screen A              | 1. Move the window to screen B (other size or scaling), or zoom the browser. 2. Reload.                         | The form shows with "The screen or the zoom changed..."; the old factors are not used.                            | `calibration-store.test.ts`                                | ⬜  | ⬜      |
| TC-UI-285-05 | Keyboard only                          | High     | Calibration page                    | 1. Tab to the width, type, Tab to the height, type, Tab to the button, press Enter. 2. Press Esc in fullscreen. | All controls reachable in order; Enter saves; Esc leaves fullscreen.                                              | `e2e/projector-calibration.spec.ts`                        | ⬜  | ⬜      |
| TC-UI-285-06 | Arabic digits                          | Medium   | Arabic page                         | 1. Type ٦٠٠٫٥ as the width.                                                                                     | Same factor as 600.5.                                                                                             | `e2e/projector-calibration.spec.ts`, `calibration.test.ts` | ⬜  | ⬜      |
| TC-UI-285-07 | Private window (storage blocked)       | Medium   | Private window or blocked site data | 1. Calibrate.                                                                                                   | "The calibration could not be saved on this device..." under the form; the page does not crash.                   | `calibration-store.test.ts`                                | ⬜  | ⬜      |
| TC-UI-285-08 | RTL and phone width                    | Medium   | Arabic page, 390 px wide            | 1. Open the page.                                                                                               | Form below the square, no horizontal page scroll; the square stays left to right.                                 | manual only                                                | ⬜  | ⬜      |
| TC-UI-285-09 | Signed out                             | Medium   | No session                          | 1. Open the calibrate URL.                                                                                      | Redirect to sign-in.                                                                                              | manual only                                                | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
