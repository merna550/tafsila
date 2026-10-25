# Test cases — Print tile layout

| Field        | Value                         |
| ------------ | ----------------------------- |
| Issue        | #283                          |
| SRS          | FR-EXP-01, FR-EXP-02          |
| Area         | export                        |
| Last updated | 2026-10-25 (by PR #283 build) |

## Test data

Seed dress, size M (`seedDress`, `sizeM` from `@tafsila/test-fixtures`). Pure maths; physical accuracy of prints is checked in #295.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID               | Title                   | Priority | Preconditions | Steps                               | Expected result                                      | Automated by                  | dev | staging |
| ---------------- | ----------------------- | -------- | ------------- | ----------------------------------- | ---------------------------------------------------- | ----------------------------- | --- | ------- |
| TC-EXPORT-283-01 | Small area is one tile  | High     | none          | Tile a 150 x 200 mm area on A4      | One tile `A1`                                        | `tile-sheet.test.ts`          | ✅  | ⬜      |
| TC-EXPORT-283-02 | Large area grid on A4   | High     | none          | Tile 1200 x 1500 mm on A4           | 7 columns, 6 rows, labels `A1` to `G6`               | `tile-sheet.test.ts`          | ✅  | ⬜      |
| TC-EXPORT-283-03 | A0 picks landscape      | Medium   | none          | Tile 1160 x 800 mm on A0            | One landscape tile                                   | `tile-sheet.test.ts`          | ✅  | ⬜      |
| TC-EXPORT-283-04 | Windows cover the area  | High     | none          | Random areas on both papers         | Union covers the area, overlap exact, none too large | `tile-sheet.property.test.ts` | ✅  | ⬜      |
| TC-EXPORT-283-05 | Empty tiles skipped     | High     | none          | Tile with a line, a big piece, none | Only touched or enclosed tiles printed               | `occupancy.test.ts`           | ✅  | ⬜      |
| TC-EXPORT-283-06 | Scale square is printed | High     | Seed dress M  | Build `tileInput`, tile on A4, A0   | The tile with the square is in `printed`             | `tile-input.test.ts`          | ✅  | ⬜      |
