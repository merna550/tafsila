# Test cases — Notches, grain, labels and the scale square

| Field        | Value                                   |
| ------------ | --------------------------------------- |
| Issue        | #131                                    |
| SRS          | FR-PAT-02, FR-VAL-04, FR-VAL-06, NFR-06 |
| Area         | engine                                  |
| Last updated | 2026-10-17 (by PR for #131)             |

## Test data

Command `pnpm engine:print marks-pair size-m --out marks.svg`: a front and a back panel (300 x 400 mm) sharing a side seam, with two notches (single and double), a waist dart, grain lines, labels and the scale square.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                  | Priority | Preconditions | Steps                                                           | Expected result                                                              | Automated by                                  | dev | staging |
| ------------- | ---------------------- | -------- | ------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- | --- | ------- |
| TC-ENG-131-01 | Notch ticks            | High     | Printed sheet | Print `marks.svg` at 100%; look at the side seam of both panels | One tick (front) and two ticks (back) on each panel, at the same height      | `packages/engine/src/finishing/marks.test.ts` | ⬜  | ⬜      |
| TC-ENG-131-02 | Notch distance         | High     | Printed sheet | Lay the two side seams together, matching the top corners       | Notches meet within 2 mm                                                     | `packages/engine/src/pipeline/marks.test.ts`  | ⬜  | ⬜      |
| TC-ENG-131-03 | Labels readable        | High     | Printed sheet | Read the name, cut and size lines on each panel                 | Arabic reads right to left, Western digits, no text touches a line or a dart | `packages/engine/src/layout/layout.test.ts`   | ⬜  | ⬜      |
| TC-ENG-131-04 | Grain arrow            | Medium   | Printed sheet | Look for the grain line on each panel                           | A double arrow, vertical, inside the piece                                   | `packages/engine/src/pipeline/marks.test.ts`  | ⬜  | ⬜      |
| TC-ENG-131-05 | One 10 cm scale square | High     | Printed sheet | Measure the square with a ruler and count squares on the sheet  | Exactly one square, 100 mm (plus or minus 1 mm)                              | `packages/engine/src/layout/layout.test.ts`   | ⬜  | ⬜      |
