# Test cases — Project the fabric layout

| Field        | Value                     |
| ------------ | ------------------------- |
| Issue        | #321                      |
| SRS          | FR-FAB-04, FR-PROJ-01..03 |
| Area         | ui                        |
| Last updated | 2026-10-28 (by #321)      |

## Test data

Use the seeded accounts and records from `supabase/seed.sql` (see `docs/backend/seed-data.md`).

| Name          | Value                                              |
| ------------- | -------------------------------------------------- |
| User          | `trial@tafsila.test` / `Test1234!`                 |
| Saved version | A dress with a fabric calculation of 140 cm folded |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                                           | Priority | Preconditions                         | Steps                                                       | Expected result                                                                                      | Automated by                   | dev | staging |
| ------------ | --------------------------------------------------------------- | -------- | ------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------ | --- | ------- |
| TC-UI-321-01 | Project the main layout of a dress                              | High     | Calibrated device, calculation saved  | 1. Press "Project the layout" under Main fabric.            | The marker appears with the fold and selvedge lines; the label shows the length; no rotation button. | `e2e/fabric-projector.spec.ts` | ⬜  | ⬜      |
| TC-UI-321-02 | Project the lining layout                                       | Medium   | Dress with lining                     | 1. Press "Project the layout" under Lining.                 | The lining marker is shown.                                                                          | manual only                    | ⬜  | ⬜      |
| TC-UI-321-03 | The verification square is still 10 cm                          | High     | Calibrated device                     | 1. Open a layout. 2. Measure the square.                    | 100 x 100 mm.                                                                                        | manual only                    | ⬜  | ⬜      |
| TC-UI-321-04 | Pan to the end of a long strip                                  | High     | Layout open                           | 1. Press Alt+Left until it stops.                           | The far end of the strip is on screen and the view stops there.                                      | `e2e/fabric-projector.spec.ts` | ⬜  | ⬜      |
| TC-UI-321-05 | Mirror                                                          | Medium   | Layout open                           | 1. Press M.                                                 | The marker is flipped.                                                                               | manual only                    | ⬜  | ⬜      |
| TC-UI-321-06 | No calibration                                                  | High     | Clear `tafsila.projector.calibration` | 1. Open a layout link. 2. Calibrate. 3. Open the projector. | Back on the same layout.                                                                             | manual only                    | ⬜  | ⬜      |
| TC-UI-321-07 | No saved calculation                                            | Medium   | Version never calculated              | 1. Open `.../projector?layout=main`.                        | "Calculate the fabric first" with a link to the calculator.                                          | manual only                    | ⬜  | ⬜      |
| TC-UI-321-08 | Physical check with a projector (Merna; the exit check is #322) | Medium   | Projector on a table                  | 1. Project a layout and lay fabric.                         | Cut line matches the fabric.                                                                         | manual only                    | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
