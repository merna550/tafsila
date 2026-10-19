# Test cases — Pockets, self-tie belt and lining

| Field        | Value                           |
| ------------ | ------------------------------- |
| Issue        | #145                            |
| SRS          | FR-PAT-07, FR-VAL-01, FR-VAL-04 |
| Area         | engine                          |
| Last updated | 2026-10-19 (by PR #145)         |

## Test data

Seed designs from `@tafsila/test-fixtures`: `linedSidePocketDress`, `patchPocketSkirt`, `linedCircleSkirt`. Print with `pnpm engine:print`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID               | Title                            | Priority | Preconditions                   | Steps                                               | Expected result                                          | Automated by                             | dev | staging |
| ---------------- | -------------------------------- | -------- | ------------------------------- | --------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------- | --- | ------- |
| TC-POCKET-145-01 | Side-seam pockets on a skirt     | High     | `linedCircleSkirt` size M       | 1. Print. 2. Match front and back pocket notches.   | Notches match within 2 mm; the bag opening fits          | `modules/pocket/pocket.test.ts` + manual | ⬜  | ⬜      |
| TC-POCKET-145-02 | Patch pocket on a skirt          | High     | `patchPocketSkirt` size M       | 1. Print. 2. Lay the pocket on the placement lines. | Four dashed lines; 30 mm top hem fold                    | `modules/pocket/pocket.test.ts` + manual | ⬜  | ⬜      |
| TC-POCKET-145-03 | Refusals                         | Medium   | tiered, pleated, side-zip specs | 1. Draft each with a pocket.                        | Bilingual `POCKET_UNSUPPORTED`, no pieces                | `modules/pocket/pocket.test.ts`          | ⬜  | ⬜      |
| TC-BELT-145-01   | Self-tie belt at 1500 mm fabric  | Medium   | `patchPocketSkirt` size M       | 1. Draft at the default fabric width. 2. Print.     | Belt parts join to waist + 20 + 900 mm                   | `modules/belt/belt.test.ts` + manual     | ⬜  | ⬜      |
| TC-BELT-145-02   | Self-tie belt split at 900 mm    | Medium   | fabric width 900 mm             | 1. Draft. 2. Check the join notches.                | Two equal parts with paired joining ends                 | `modules/belt/belt.test.ts`              | ⬜  | ⬜      |
| TC-LINING-145-01 | Lined dress with side pockets    | High     | `linedSidePocketDress` size M   | 1. Print. 2. Lay lining on shell.                   | Lining hem 25 mm above the shell hem; lining fabric note | `modules/lining/lining.test.ts` + manual | ⬜  | ⬜      |
| TC-LINING-145-02 | Lined half-circle skirt hem rise | Medium   | `linedCircleSkirt` size M       | 1. Print. 2. Measure the hem rise.                  | Hem raised 25 mm, 20 mm lining hem                       | `modules/lining/lining.test.ts` + manual | ⬜  | ⬜      |
