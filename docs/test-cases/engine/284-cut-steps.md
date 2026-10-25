# Test cases — Direct-cut marking steps

| Field        | Value                         |
| ------------ | ----------------------------- |
| Issue        | #284                          |
| SRS          | FR-CUT-01, FR-CUT-02, NFR-01  |
| Area         | engine                        |
| Last updated | 2026-10-25 (by PR #284 build) |

## Test data

Seed dress, size M (`seedDress`, `size-m` from `@tafsila/test-fixtures`). The step texts are in `packages/engine/src/cut/__snapshots__/seed-dress-steps.txt`. Cutting a real toile from the steps is Merna's #296.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                          | Priority | Preconditions        | Steps                                                                                          | Expected result                                                                     | Automated by                 | dev | staging |
| ------------- | ------------------------------ | -------- | -------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------- | --- | ------- |
| TC-ENG-284-01 | Arabic step texts are clear    | High     | Snapshot file open   | Read the Arabic texts of the seed dress front and back; mark any unclear word                  | Every step can be followed without asking; no Eastern digits                        | none (manual)                | ⬜  | ⬜      |
| TC-ENG-284-02 | Points measure true on paper   | High     | Paper, ruler, square | Draw the reference and top line; mark 3 points of the front (a corner, a curve point, a notch) | Each point within 1 mm of the printed toile piece laid on top (`pnpm engine:print`) | none (manual)                | ⬜  | ⬜      |
| TC-ENG-284-03 | Fold and grain references      | High     | none                 | Run the unit tests                                                                             | A fold piece uses the fold; a piece without a fold uses the grain-parallel line     | `frame.test.ts`              | ✅  | ⬜      |
| TC-ENG-284-04 | Points and connections on line | High     | none                 | Run the property test over the catalogue and size matrix                                       | Points within 0.5 mm, connections within 1 mm of the cut line                       | `cut-steps.property.test.ts` | ✅  | ⬜      |
| TC-ENG-284-05 | Curve spacing                  | High     | none                 | Same property test at steps 20, 25 and 30 mm                                                   | Gaps never above the step; in the step band on long curves (halved on tight bends)  | `cut-steps.property.test.ts` | ✅  | ⬜      |
| TC-ENG-284-06 | Steps numbered without gaps    | Medium   | none                 | Run the unit tests                                                                             | Steps 1..N, labels unique, `AA` after `Z`, last step is the cut                     | `steps.test.ts`              | ✅  | ⬜      |
| TC-ENG-284-07 | Step outside 20-30 mm refused  | Medium   | none                 | Call `cutSteps` with 19 or 31 mm                                                               | `CUT_STEP_OUT_OF_RANGE`                                                             | `steps.test.ts`              | ✅  | ⬜      |
