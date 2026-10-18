# Test cases — Circle skirts (half and full)

| Field        | Value                           |
| ------------ | ------------------------------- |
| Issue        | #136                            |
| SRS          | FR-PAT-05, FR-VAL-03, FR-VAL-08 |
| Area         | engine                          |
| Last updated | 2026-10-18 (by PR for #136)     |

## Test data

Design fixtures `halfCircleKneeSkirt`, `fullCircleKneeSkirt` (side zip) and `vNeckHalfCircleDress` (centre-back zip). Sizes from `SIZE_MATRIX`. Snapshots: `packages/engine/src/modules/circle-skirt/__snapshots__/` (fabric 1500 and 900 mm).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID               | Title               | Priority | Preconditions          | Steps                                                                             | Expected result                                                                                   | Automated by                                              | dev | staging |
| ---------------- | ------------------- | -------- | ---------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --- | ------- |
| TC-CIRCLE-136-01 | Half circle, size M | High     | Repo checked out       | Open `circle-half-fabric-1500-size-m` snapshot; measure the waist stitch line     | Front and back on the fold; waist of both pieces × 2 = waist + ease (± 5 mm); smooth arcs         | `packages/engine/src/modules/circle-skirt/module.test.ts` | ⬜  | ⬜      |
| TC-CIRCLE-136-02 | Full circle, size M | High     | Repo checked out       | Open `circle-full-fabric-1500-size-m` snapshot                                    | Each piece is a quarter circle ring; side seam horizontal; waist radius about (waist + ease) / 2π | `packages/engine/src/modules/circle-skirt/draft.test.ts`  | ⬜  | ⬜      |
| TC-CIRCLE-136-03 | Narrow fabric split | High     | Repo checked out       | Open the `fabric-900` snapshots                                                   | Front and back each say cut 2 (mirrored), with 15 mm allowance on CF / CB; no width warning       | `packages/engine/src/modules/circle-skirt/split.test.ts`  | ⬜  | ⬜      |
| TC-CIRCLE-136-04 | Paired split seams  | Medium   | Printed split pieces   | Lay the two front copies on each other at CF, then front to back at the side      | CF edges are the same length; side seams match from waist to hem (± 2 mm)                         | `packages/engine/src/modules/circle-skirt/module.test.ts` | ⬜  | ⬜      |
| TC-CIRCLE-136-05 | Grain and bias note | Medium   | Printed sheet          | Check the grain arrow; read the hem note text (`CIRCLE_SKIRT_HEM_LEVELLING_NOTE`) | Grain arrow parallel to CF / CB on every piece; the note says hang 24 h, then level the hem       | `packages/engine/src/modules/circle-skirt/module.test.ts` | ⬜  | ⬜      |
| TC-CIRCLE-136-06 | Toile in S, M, XXL  | High     | Calico, printed sheets | Cut and sew the half circle (demo dress skirt) in 3 sizes; hang 24 h; level hem   | Waist sits without gaping or pulling; seams meet; hem drop and fit notes logged in sew-tests.md   | manual only (`needs:sew-test`)                            | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
