# Test cases — Gathered, knife-pleated and tiered skirts

| Field        | Value                                      |
| ------------ | ------------------------------------------ |
| Issue        | #137                                       |
| SRS          | FR-PAT-05, FR-VAL-01, FR-VAL-03, FR-VAL-08 |
| Area         | engine                                     |
| Last updated | 2026-10-18 (by PR for #137)                |

## Test data

Design fixtures `gatheredKneeSkirt`, `pleatedKneeSkirt` (side zip) and `tieredMidiSkirt` (centre-back zip). Sizes from `SIZE_MATRIX`. Snapshots: `packages/engine/src/modules/skirt/__snapshots__/panel-skirt-*.svg` (fabric 1500 mm for every chart size, 900 mm for size M).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID              | Title                | Priority | Preconditions          | Steps                                                                                    | Expected result                                                                                                     | Automated by                                             | dev | staging |
| --------------- | -------------------- | -------- | ---------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --- | ------- |
| TC-SKIRT-137-01 | Gathered, size M     | High     | Repo checked out       | Open `panel-skirt-SVG-snapshot-gathered-fabric-1500-size-m.svg`; read the waist words    | Front and back rectangles on the fold; dotted gather line under the waist says "جمّعي إلى … مم"; × 4 = waist + ease | `packages/engine/src/modules/skirt/panel-skirts.test.ts` | ⬜  | ⬜      |
| TC-SKIRT-137-02 | Pleated, size M      | High     | Repo checked out       | Open the `pleated-fabric-1500-size-m` snapshot; count the pleats; measure one intake     | 4 pleats per quarter; fold line solid, placement line dashed, 60 mm apart; pleated waist × 4 = waist + ease ± 5 mm  | `packages/engine/src/modules/skirt/panel-skirts.test.ts` | ⬜  | ⬜      |
| TC-SKIRT-137-03 | Tiered, size M       | High     | Repo checked out       | Open the `tiered-fabric-1500-size-m` snapshot                                            | Three tiers, each 1.5 × wider; each tier top has a gather line to the width of the tier above                       | `packages/engine/src/modules/skirt/panel-skirts.test.ts` | ⬜  | ⬜      |
| TC-SKIRT-137-04 | Fold arrows          | Medium   | Printed pleated sheet  | Fold each pleat on its fold line and lay it on the placement line in the arrow direction | All pleats face the same way; the folded top equals the waist quarter + ease (± 5 mm)                               | `packages/engine/src/modules/skirt/panels.test.ts`       | ⬜  | ⬜      |
| TC-SKIRT-137-05 | Narrow-fabric panels | High     | Repo checked out       | Open the `fabric-900` snapshots                                                          | Pieces are `skirt-panel` or `tier-k-panel`, cut 2 × n; each fits 900 mm with allowances; no width warning           | `packages/engine/src/modules/skirt/panel-skirts.test.ts` | ⬜  | ⬜      |
| TC-SKIRT-137-06 | Toiles in 3 sizes    | High     | Calico, printed sheets | Sew one tiered and one pleated skirt in S, M, XXL (follow-up issue)                      | Waist sits flat; gathers even; pleats hang straight; fit notes logged in sew-tests.md                               | manual only (`needs:sew-test`)                           | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
