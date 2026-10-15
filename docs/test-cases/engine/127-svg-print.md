# Test cases — SVG renderer and toile print

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #127                        |
| SRS          | NFR-08, FR-PAT-02, SRS §11  |
| Area         | engine                      |
| Last updated | 2026-10-15 (by PR for #127) |

## Test data

Command `pnpm engine:print rectangle size-m --out toile.svg` (the 200 x 300 mm test rectangle).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                | Priority | Preconditions    | Steps                                                         | Expected result                                                         | Automated by                             | dev | staging |
| ------------- | -------------------- | -------- | ---------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------- | --- | ------- |
| TC-ENG-127-01 | Print the rectangle  | High     | A printer        | Print `toile.svg` from Chrome at 100% (not "fit to page")     | The scale square measures 100 mm with a ruler (plus or minus 1 mm)      | Manual                                   | ⬜  | ⬜      |
| TC-ENG-127-02 | Piece size           | High     | Printed sheet    | Measure the stitch line rectangle and the cut line            | Stitch line 200 x 300 mm; cut line 15 mm outside it                     | Manual                                   | ⬜  | ⬜      |
| TC-ENG-127-03 | RTL label            | High     | Chrome           | Open `toile.svg` in Chrome                                    | The Arabic word reads right to left, centred in the piece, not mirrored | Manual                                   | ⬜  | ⬜      |
| TC-ENG-127-04 | Same bytes each time | High     | None             | Run the command twice to two files and `diff` them            | The diff is empty                                                       | `packages/engine/src/render/svg.test.ts` | ⬜  | ⬜      |
| TC-ENG-127-05 | Bad arguments        | Medium   | None             | Run `pnpm engine:print nope size-m`                           | Usage message, exit code 2, no file written                             | `packages/engine/scripts/print.test.ts`  | ⬜  | ⬜      |
| TC-ENG-127-06 | Print shop check     | Medium   | Inkscape or shop | Open the file in Illustrator/Inkscape or send it to a plotter | The scale square is still 100 mm                                        | Manual                                   | ⬜  | ⬜      |
