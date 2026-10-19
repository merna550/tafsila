# Test cases — Sewing order

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #146                        |
| SRS          | FR-PAT-06, NFR-06           |
| Area         | engine                      |
| Last updated | 2026-10-19 (by PR for #146) |

## Test data

Seed designs from `@tafsila/test-fixtures` at size M; the printed steps are in `packages/engine/src/sewing/__snapshots__/`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                  | Priority | Preconditions                               | Steps                                           | Expected result                                                      | Automated by                    | dev | staging |
| ------------- | -------------------------------------- | -------- | ------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------- | ------------------------------- | --- | ------- |
| TC-ENG-146-01 | Arabic step text is plain              | High     | Snapshots of each seed                      | 1. Read each `.txt` file                        | Arabic is plain, feminine imperative, uses the glossary words        | `sewing-order.snapshot.test.ts` | ⬜  | ⬜      |
| TC-ENG-146-02 | Half-circle dress order                | High     | `vNeckHalfCircleDress`                      | 1. Follow the steps in order                    | No step needs a seam that is not sewn yet; waist seam before the zip | `sewing-order.snapshot.test.ts` | ⬜  | ⬜      |
| TC-ENG-146-03 | Button blouse and gathered skirt order | Medium   | `buttonFrontBlouse`, `elasticGatheredSkirt` | 1. Follow the steps                             | Same check as TC-ENG-146-02                                          | manual only                     | ⬜  | ⬜      |
| TC-ENG-146-04 | Every seam sewn once                   | High     | All designs x size matrix                   | 1. Run the property test                        | `sewingCoverage` is ok; steps numbered 1..n                          | `sewing-order.property.test.ts` | ⬜  | ⬜      |
| TC-ENG-146-05 | Sew-test: toile in printed order       | Medium   | Printed toile                               | 1. Sew in order; note any step that had to move | Notes logged in `sew-tests.md`                                       | manual only (`needs:sew-test`)  | ⬜  | ⬜      |
