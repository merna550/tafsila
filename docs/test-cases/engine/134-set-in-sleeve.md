# Test cases — Set-in sleeve block

| Field        | Value                          |
| ------------ | ------------------------------ |
| Issue        | #134                           |
| SRS          | FR-PAT-05, FR-VAL-01, -02, -04 |
| Area         | engine                         |
| Last updated | 2026-10-18 (by the PR of #134) |

## Test data

Seed design `setInSleeveBlouse` (`@tafsila/test-fixtures`), chart sizes from the size matrix. Print 1:1 with `pnpm engine:print setInSleeveBlouse size-m` (change the length in a copy of the design for the other lengths).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                         | Priority | Preconditions           | Steps                                                                                | Expected result                                                                                        | Automated by                            | dev | staging |
| ------------- | ----------------------------- | -------- | ----------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | --------------------------------------- | --- | ------- |
| TC-ENG-134-01 | Short sleeve, size S          | High     | Printed sheet           | 1. Print the blouse with a short sleeve, size S. 2. Measure the underarm seam.       | Hem 70 mm below the underarm line; both underarm seam halves equal (± 2 mm)                            | `blocks/sleeve/draft-sleeve.test.ts`    | ⬜  | ⬜      |
| TC-ENG-134-02 | Long sleeve, size M, on paper | High     | Aldrich 6th ed. at hand | 1. Print size M long. 2. Compare cap top, bicep width, wrist with the Aldrich draft. | Bicep 345 mm, wrist 190 mm, length 575 mm; cap height 179 mm (Aldrich start 146.7 mm, decision 134, 1) | `blocks/sleeve/draft-sleeve.test.ts`    | ⬜  | ⬜      |
| TC-ENG-134-03 | Three-quarter sleeve, XXL     | Medium   | Printed sheet           | 1. Print XXL three-quarter. 2. Measure sleeve length on the grain line.              | Hem at 0.78 × arm length (460 mm)                                                                      | `blocks/sleeve/sleeve.snapshot.test.ts` | ⬜  | ⬜      |
| TC-ENG-134-04 | Notches match the armhole     | High     | Printed bodice + sleeve | 1. Walk the cap along the armhole from each underarm.                                | Front single and back double notches meet within 2 mm; shoulder notch meets the shoulder seam          | `blocks/sleeve/sleeve.property.test.ts` | ⬜  | ⬜      |
| TC-ENG-134-05 | Sleeveless armhole            | Medium   | `dartedBlouse`          | 1. Print `dartedBlouse` size M.                                                      | No sleeve piece, no armhole notches, armhole keeps its seam allowance for a facing or binding          | `blocks/sleeve/module.test.ts`          | ⬜  | ⬜      |
| TC-ENG-134-06 | Body no cap fits              | Medium   | none                    | 1. Generate size M with upper arm 500 mm.                                            | `fail` result with code `SLEEVE_CAP_UNSOLVABLE` and the Arabic message                                 | `blocks/sleeve/module.test.ts`          | ⬜  | ⬜      |
| TC-ENG-134-07 | Toile in 3 sizes              | High     | Calico, sewing machine  | 1. Sew blouse + long sleeve in S, M, XXL. 2. Log in `sew-tests.md`.                  | Cap eases in without pleats; sleeve hangs straight; fit notes logged                                   | manual only (`needs:sew-test`)          | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
