# Test cases — Catalogue × size matrix

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #147                        |
| SRS          | FR-PAT-01..06, FR-PAT-04    |
| Area         | engine                      |
| Last updated | 2026-10-19 (by PR for #147) |

## Test data

The 25-entry size matrix and the catalogue fixtures from `@tafsila/test-fixtures`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                        | Priority | Preconditions    | Steps                                                                                | Expected result                                                | Automated by                       | dev | staging |
| ------------- | ---------------------------- | -------- | ---------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ---------------------------------- | --- | ------- |
| TC-ENG-147-01 | Snapshots look like patterns | Medium   | Repo checked out | Open the 15 SVGs in `packages/engine/src/pipeline/__snapshots__/catalogue-SVG-*.svg` | Each shows closed pieces that grow from S to XXL               | `catalogue.snapshot.test.ts`       | ⬜  | ⬜      |
| TC-ENG-147-02 | Failure prints the case      | High     | Repo checked out | Break a module rule locally and run the property suite                               | The failure shows the shrunk spec and the measurements as JSON | `catalogue-sizes.property.test.ts` | ⬜  | ⬜      |
| TC-ENG-147-03 | Speed number is recorded     | Medium   | PR open          | Read the p95 in the PR body                                                          | A number under 500 ms                                          | `generate-pattern.budget.test.ts`  | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
