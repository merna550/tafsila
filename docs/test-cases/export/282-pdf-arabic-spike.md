# Test cases — PDF Arabic labels and 1:1 lines (spike)

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #282                        |
| SRS          | none (spike, ADR-282)       |
| Area         | export                      |
| Last updated | 2026-10-25 (by PR for #282) |

## Test data

Run `pnpm --filter @tafsila/export spike:pdf`; it writes `packages/export/spike-out/spike.pdf` (A0, seed dress piece, 100 mm square, five labels).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                  | Priority | Preconditions         | Steps                                                | Expected result                                                                                        | Automated by                                 | dev | staging |
| ------------- | -------------------------------------- | -------- | --------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------- | --- | ------- |
| TC-EXP-282-01 | 100 mm square is 283.46 pt             | High     | none                  | Read the marked square back from the PDF             | Width and height 283.46 pt (+-0.01)                                                                    | `packages/export/src/pdf/spike.test.ts`      | ✅  | ⬜      |
| TC-EXP-282-02 | Outline is 1:1 and not flipped         | High     | none                  | Read the outline bounds back                         | Equal to the engine bbox in pt; top of the piece at the top of the page                                | `packages/export/src/pdf/spike.test.ts`      | ✅  | ⬜      |
| TC-EXP-282-03 | Label run order                        | High     | none                  | Shape the label and a mixed Arabic and Latin label   | Latin name and digit groups are not reversed                                                           | `packages/export/src/pdf/spike.test.ts`      | ✅  | ⬜      |
| TC-EXP-282-04 | Byte-identical rebuild and subset size | Medium   | none                  | Build twice                                          | Same bytes; file under 120 KB                                                                          | `packages/export/src/pdf/spike.test.ts`      | ✅  | ⬜      |
| TC-EXP-282-05 | Arabic reads correctly in Chrome       | High     | `spike.pdf` available | Open in Chrome's PDF viewer; read the five labels    | Letters joined, "فستان - Nour" shows Nour on the left, "كم ١٢ سم" reads right to left with ١٢ in order | manual only (checked on #295 with the print) | ⬜  | ⬜      |
| TC-EXP-282-06 | Printed square measures 100 mm         | High     | A printer, a ruler    | Print `spike.pdf` at 100 percent, measure the square | 100 mm (+-1 mm)                                                                                        | manual only (#295)                           | ⬜  | ⬜      |
