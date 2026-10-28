# Test cases — Nesting placement and yardage

| Field        | Value                                |
| ------------ | ------------------------------------ |
| Issue        | #316                                 |
| SRS          | FR-FAB-02, FR-FAB-03, NFR-02, NFR-08 |
| Area         | engine                               |
| Last updated | 2026-10-28 (by PR #330)              |

## Test data

No accounts needed: the cases use the five fixture designs of `@tafsila/test-fixtures` through `pnpm --filter @tafsila/nesting print nest <fixture> [folded|open] [widthCm] [size]`. Lengths use the default options: 5 % shrinkage, no pattern repeat, no nap.

| Name    | Value                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------- |
| Designs | `seedDress`, `vNeckHalfCircleDress`, `setInSleeveBlouse`, `gatheredKneeSkirt`, `linedSidePocketDress` |
| Sizes   | M, XXL                                                                                                |
| Widths  | 140 cm, 115 cm; folded and open                                                                       |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                            | Priority | Preconditions                          | Steps                                                                                                                                                                                            | Expected result                                                                                                                                              | Automated by                         | dev | staging |
| ------------- | ------------------------------------------------ | -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | --- | ------- |
| TC-FAB-316-01 | Seed dress layout looks like a tailor's          | High     | Repo checked out                       | 1. `pnpm --filter @tafsila/nesting print nest seedDress folded 140 M`. 2. Sketch the placements on paper (x along the selvedge, y = 0 the fold). 3. Compare with how Merna would lay the pieces. | Fold pieces on the fold, other pieces toward the selvedge, nothing overlaps, main 1.4 m; a layout Merna would accept or one she can beat by less than 10 cm. | `nest.property.test.ts` (no overlap) | ⬜  | ⬜      |
| TC-FAB-316-02 | Lined dress lists main and lining apart          | High     | Repo checked out                       | 1. `pnpm --filter @tafsila/nesting print nest linedSidePocketDress folded 140 M`.                                                                                                                | Three blocks: main 1.7 m, lining 1.2 m, interfacing 0.2 m, each with its own placements.                                                                     | `nest.regression.test.ts`            | ⬜  | ⬜      |
| TC-FAB-316-03 | Recorded lengths are the input of the #322 check | High     | Merna's hand layouts of the 5 garments | 1. For each row below, lay the pieces by hand on the same width and layout. 2. Write the length in "Merna's layout" and the difference.                                                          | Every difference within ±10 cm (ADR-313 "Revisit when").                                                                                                     | manual only                          | ⬜  | ⬜      |
| TC-FAB-316-04 | Rounding and allowances                          | Medium   | Repo checked out                       | 1. Read `length.test.ts`.                                                                                                                                                                        | 1230 mm + 5 % → 1.3 m; 1000 mm + 0 % → 1.0 m; repeat added once per row before rounding.                                                                     | `length.test.ts`                     | ⬜  | ⬜      |
| TC-FAB-316-05 | Circle skirt too wide on 115 cm folded           | Medium   | Repo checked out                       | 1. `pnpm --filter @tafsila/nesting print nest vNeckHalfCircleDress folded 115 M`.                                                                                                                | `skirt-back` and `skirt-front` listed as "does not fit" under main; the rest placed.                                                                         | `nest.test.ts`                       | ⬜  | ⬜      |

Every case covers one of: happy path, validation/errors, permissions (other user's data), edge values (min/max sizes), RTL/Arabic display, mobile width, and for engine features: physical sew test (`needs:sew-test`).

## Recorded lengths (nesting 1.0.0)

Pinned in `packages/nesting/src/nest.regression.test.ts`. "-" means the pattern has no piece of that fabric. Circle-skirt pieces wider than the usable width are left out (see TC-FAB-316-05), so those main lengths do not include them.

| Pattern                | Size | Width  | Layout | Main strip (mm) | Main (m) | Lining (m) | Interfacing (m) | Merna's layout (m) | Difference |
| ---------------------- | ---- | ------ | ------ | --------------- | -------- | ---------- | --------------- | ------------------ | ---------- |
| `seedDress`            | M    | 140 cm | folded | 1301            | 1.4      | -          | 0.2             |                    |            |
| `seedDress`            | M    | 140 cm | open   | 1212            | 1.3      | -          | 0.2             |                    |            |
| `seedDress`            | M    | 115 cm | folded | 1793            | 1.9      | -          | 0.2             |                    |            |
| `seedDress`            | M    | 115 cm | open   | 1572            | 1.7      | -          | 0.2             |                    |            |
| `seedDress`            | XXL  | 140 cm | folded | 1805            | 1.9      | -          | 0.2             |                    |            |
| `seedDress`            | XXL  | 140 cm | open   | 1568            | 1.7      | -          | 0.2             |                    |            |
| `seedDress`            | XXL  | 115 cm | folded | 2327            | 2.5      | -          | 0.2             |                    |            |
| `seedDress`            | XXL  | 115 cm | open   | 1877            | 2.0      | -          | 0.2             |                    |            |
| `vNeckHalfCircleDress` | M    | 140 cm | folded | 1859            | 2.0      | -          | 0.5             |                    |            |
| `vNeckHalfCircleDress` | M    | 140 cm | open   | 1846            | 2.0      | -          | 0.5             |                    |            |
| `vNeckHalfCircleDress` | M    | 115 cm | folded | 898             | 1.0      | -          | 0.5             |                    |            |
| `vNeckHalfCircleDress` | M    | 115 cm | open   | 1601            | 1.7      | -          | 0.5             |                    |            |
| `vNeckHalfCircleDress` | XXL  | 140 cm | folded | 1661            | 1.8      | -          | 0.5             |                    |            |
| `vNeckHalfCircleDress` | XXL  | 140 cm | open   | 2195            | 2.4      | -          | 0.5             |                    |            |
| `vNeckHalfCircleDress` | XXL  | 115 cm | folded | 1109            | 1.2      | -          | 0.5             |                    |            |
| `vNeckHalfCircleDress` | XXL  | 115 cm | open   | 1880            | 2.0      | -          | 0.5             |                    |            |
| `setInSleeveBlouse`    | M    | 140 cm | folded | 917             | 1.0      | -          | 0.2             |                    |            |
| `setInSleeveBlouse`    | M    | 140 cm | open   | 887             | 1.0      | -          | 0.2             |                    |            |
| `setInSleeveBlouse`    | M    | 115 cm | folded | 1073            | 1.2      | -          | 0.2             |                    |            |
| `setInSleeveBlouse`    | M    | 115 cm | open   | 1045            | 1.1      | -          | 0.2             |                    |            |
| `setInSleeveBlouse`    | XXL  | 140 cm | folded | 1103            | 1.2      | -          | 0.2             |                    |            |
| `setInSleeveBlouse`    | XXL  | 140 cm | open   | 1105            | 1.2      | -          | 0.2             |                    |            |
| `setInSleeveBlouse`    | XXL  | 115 cm | folded | 1433            | 1.6      | -          | 0.2             |                    |            |
| `setInSleeveBlouse`    | XXL  | 115 cm | open   | 1164            | 1.3      | -          | 0.2             |                    |            |
| `gatheredKneeSkirt`    | M    | 140 cm | folded | 1240            | 1.4      | -          | 0.9             |                    |            |
| `gatheredKneeSkirt`    | M    | 140 cm | open   | 1240            | 1.4      | -          | 0.9             |                    |            |
| `gatheredKneeSkirt`    | M    | 115 cm | folded | 1240            | 1.4      | -          | 0.9             |                    |            |
| `gatheredKneeSkirt`    | M    | 115 cm | open   | 1240            | 1.4      | -          | 0.9             |                    |            |
| `gatheredKneeSkirt`    | XXL  | 140 cm | folded | 1259            | 1.4      | -          | 1.2             |                    |            |
| `gatheredKneeSkirt`    | XXL  | 140 cm | open   | 1259            | 1.4      | -          | 1.2             |                    |            |
| `gatheredKneeSkirt`    | XXL  | 115 cm | folded | 2354            | 2.5      | -          | 1.2             |                    |            |
| `gatheredKneeSkirt`    | XXL  | 115 cm | open   | 1259            | 1.4      | -          | 1.2             |                    |            |
| `linedSidePocketDress` | M    | 140 cm | folded | 1536            | 1.7      | 1.2        | 0.2             |                    |            |
| `linedSidePocketDress` | M    | 140 cm | open   | 1391            | 1.5      | 1.2        | 0.2             |                    |            |
| `linedSidePocketDress` | M    | 115 cm | folded | 1824            | 2.0      | 1.7        | 0.2             |                    |            |
| `linedSidePocketDress` | M    | 115 cm | open   | 1668            | 1.8      | 1.4        | 0.2             |                    |            |
| `linedSidePocketDress` | XXL  | 140 cm | folded | 1860            | 2.0      | 1.7        | 0.2             |                    |            |
| `linedSidePocketDress` | XXL  | 140 cm | open   | 1698            | 1.8      | 1.4        | 0.2             |                    |            |
| `linedSidePocketDress` | XXL  | 115 cm | folded | 2327            | 2.5      | 2.1        | 0.2             |                    |            |
| `linedSidePocketDress` | XXL  | 115 cm | open   | 2043            | 2.2      | 1.8        | 0.2             |                    |            |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
