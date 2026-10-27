# Test cases — Fabric knowledge base review

| Field        | Value                        |
| ------------ | ---------------------------- |
| Issue        | #314                         |
| SRS          | FR-REC-01, FR-REC-02, NFR-06 |
| Area         | engine                       |
| Last updated | 2026-10-27 (by PR for #314)  |

## Test data

Draft data: `packages/fabric-kb/src/draft-catalogue.ts` and `draft-rules.ts`. Print a recommendation with `pnpm --filter @tafsila/fabric-kb print <fixture>` (for example `vNeckHalfCircleDress`, `puffSleeveBlouse`, `pleatedKneeSkirt`).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                           | Priority | Preconditions          | Steps                                                                 | Expected result                                                          | Automated by                      | dev | staging |
| ------------- | ------------------------------- | -------- | ---------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------- | --- | ------- |
| TC-FAB-314-01 | Fabric scales are right         | High     | Draft catalogue open   | 1. Read the five 0 to 4 values and care notes of each fabric.         | A tailor would not dispute any value; corrections are written in the PR. | `draft-data.test.ts` (shape only) | ⬜  | ⬜      |
| TC-FAB-314-02 | Rule reasons make sewing sense  | High     | Draft rules open       | 1. Read each rule's Arabic and English reason and its range.          | Wording is natural Arabic and the advice is right.                       | `validate-rules.test.ts` (shape)  | ⬜  | ⬜      |
| TC-FAB-314-03 | Recommendations match a tailor  | High     | Five designs she knows | 1. Print the recommendation for each. 2. Compare with her own advice. | Recommended fabrics and the avoid list match what she would suggest.     | `recommend.test.ts` (snapshots)   | ⬜  | ⬜      |
| TC-FAB-314-04 | Market names are the shop names | Medium   | Draft catalogue open   | 1. Read `nameAr` of each fabric.                                      | Each is the name Egyptian fabric shops use.                              | manual only                       | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
