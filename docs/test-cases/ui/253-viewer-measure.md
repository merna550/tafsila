# Test cases - Viewer measure tool

| Field        | Value                          |
| ------------ | ------------------------------ |
| Issue        | #253                           |
| SRS          | FR-VIEW-03                     |
| Area         | ui                             |
| Last updated | 2026-10-25 (by the PR of #253) |

## Test data

Open `/ar/dev/pattern-viewer` (and `/en/dev/pattern-viewer`), or any pattern page. The dev route returns 404 in production.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                           | Priority | Preconditions   | Steps                                                                              | Expected result                                                                    | Automated by                                             | dev | staging |
| ------------ | ------------------------------- | -------- | --------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------- | --- | ------- |
| TC-UI-253-01 | Measure a piece against paper   | High     | Printed pattern | 1. Press measure. 2. Tap two corners of a piece. 3. Measure the same on the paper. | The screen distance equals the paper distance within 0.1 cm; a third tap restarts. | manual only                                              | ⬜  | ⬜      |
| TC-UI-253-02 | Tap and point list agree        | High     | Viewer is drawn | 1. Measure by two taps. 2. Choose the same points in "from" and "to".              | Both give the same text; Escape leaves the tool and clears the marks.              | `e2e/pattern-viewer-measure.spec.ts`, `Measure.test.tsx` | ⬜  | ⬜      |
| TC-UI-253-03 | Drag still pans in measure mode | Medium   | Phone, 360 px   | 1. Press measure. 2. Drag the drawing. 3. Tap near a corner.                       | The drag pans and picks nothing; the tap picks the corner.                         | manual only                                              | ⬜  | ⬜      |
| TC-UI-253-04 | Snap on dense points            | Low      | Small piece     | 1. Measure at fit zoom. 2. Zoom in and measure again.                              | Zooming in makes the right point easy to pick.                                     | manual only                                              | ⬜  | ⬜      |
| TC-UI-253-05 | Screen reader                   | Medium   | A screen reader | 1. Press measure. 2. Choose "from" and "to".                                       | The distance is announced; the toggle reads as pressed.                            | manual only                                              | ⬜  | ⬜      |
