# Test cases - Design picker frame

| Field        | Value                          |
| ------------ | ------------------------------ |
| Issue        | #244                           |
| SRS          | FR-DES-06                      |
| Area         | ui                             |
| Last updated | 2026-10-25 (by the PR of #244) |

## Test data

Any confirmed account; for the client chip open a client's profile first and copy her id.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID               | Title                               | Priority | Preconditions       | Steps                                                                                    | Expected result                                                                                    | Automated by                        | dev | staging |
| ---------------- | ----------------------------------- | -------- | ------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------- | --- | ------- |
| TC-DESIGN-244-01 | Start each category                 | High     | Signed in           | 1. Open `/designs/new?clientId=<id>`. 2. Choose dress, then repeat for skirt and blouse. | The editor opens at `/designs/<id>?clientId=<id>`; a skirt has no bodice, neckline or sleeve steps | `e2e/design-picker.spec.ts`         | ⬜  | ⬜      |
| TC-DESIGN-244-02 | Reset notice and undo               | Medium   | Editor open (dress) | 1. Turn the waist seam off while the skirt is gathered (options arrive in #246).         | A notice names the changed feature; Undo restores the previous design                              | `model/editor-state.test.ts`        | ⬜  | ⬜      |
| TC-DESIGN-244-03 | Reload keeps the step and the draft | High     | Editor open         | 1. Open the sleeve step. 2. Reload.                                                      | The sleeve step is still open; an unsaved change is still there                                    | `e2e/design-picker.spec.ts`         | ⬜  | ⬜      |
| TC-DESIGN-244-04 | Arabic (RTL) and 360 px             | High     | Phone 360 px        | 1. Open both screens in Arabic and English.                                              | Cards fit two columns, the step list scrolls sideways, nothing overflows the page; layout mirrors  | manual only (visual baseline: #265) | ⬜  | ⬜      |
| TC-DESIGN-244-05 | API error on create                 | Medium   | API stopped         | 1. Choose a category.                                                                    | The shared error toast appears; the cards stay and can be chosen again                             | manual only                         | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
