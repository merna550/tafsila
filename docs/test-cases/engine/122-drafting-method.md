# Test cases — Drafting method and reference drafts

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #122                        |
| SRS          | FR-PAT-01, NFR-01           |
| Area         | engine                      |
| Last updated | 2026-10-15 (by PR for #122) |

## Test data

`egyptianSizeChart` sizes S, M and XXL from `@tafsila/test-fixtures`; reference points in `referenceDrafts`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                           | Priority | Preconditions         | Steps                                                                                                                                                                                                           | Expected result                                                                  | Automated by                 | dev | staging |
| ------------- | ----------------------------------------------- | -------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------- | --- | ------- |
| TC-ENG-122-01 | Every block has every key point for S, M, XXL   | High     | none                  | Read `referenceDrafts` for each size and block                                                                                                                                                                  | All names in `drafting-method.md` exist, all coordinates finite                  | `reference-drafts.test.ts`   | ⬜  | ⬜      |
| TC-ENG-122-02 | Fixture equals the calculation                  | High     | none                  | Compare `referenceDrafts` with `reference-drafts-calc.ts` output                                                                                                                                                | Equal; a changed constant fails until the fixture is regenerated                 | `reference-drafts.test.ts`   | ⬜  | ⬜      |
| TC-ENG-122-03 | Widths and lengths follow the measurements      | High     | none                  | Check bust quarter plus ease, hip depth, knee length, arm length                                                                                                                                                | Within 0.05 mm of the measurement formula                                        | `reference-drafts.test.ts`   | ⬜  | ⬜      |
| TC-ENG-122-04 | Size M agrees with an independent recomputation | High     | none                  | Recompute 24 key points of M in a separate script from the formulas; after #128 also the 6 changed values (back shoulder tip and width point, bust dart apex, both front waist dart legs, back shoulder length) | All within 0.1 mm (rounding)                                                     | manual only (PR description) | ⬜  | ⬜      |
| TC-ENG-122-05 | Merna checks the method against the book        | High     | Her copy, 6th edition | Compare constants, step order and fill the page column                                                                                                                                                          | Differences are changed in `DRAFT_CONSTANTS` and regenerated; page column filled | manual only                  | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
