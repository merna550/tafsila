# Test cases — Straight skirt block

| Field        | Value                                             |
| ------------ | ------------------------------------------------- |
| Issue        | #129                                              |
| SRS          | FR-PAT-01, FR-PAT-05, FR-VAL-01, -03, -07, NFR-01 |
| Area         | engine                                            |
| Last updated | 2026-10-17 (by PR for #129)                       |

## Test data

Design fixture `straightKneeSkirt` (straight, knee length, side zip). Sizes from `SIZE_MATRIX` (`size-s`, `size-m`, `size-xxl`). Print: `pnpm engine:print straightKneeSkirt size-m --out skirt-m.svg`. Snapshots: `packages/engine/src/blocks/skirt/__snapshots__/`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title               | Priority | Preconditions           | Steps                                                                                | Expected result                                                                                    | Automated by                                                | dev | staging |
| ------------- | ------------------- | -------- | ----------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --- | ------- |
| TC-ENG-129-01 | SVG of S, M, XXL    | High     | Repo checked out        | Open the S, M and XXL snapshot SVGs in a browser                                     | Front and back, one waist dart each, smooth hip curve, straight side from hip to hem, labels shown | `packages/engine/src/blocks/skirt/skirt-module.test.ts`     | ⬜  | ⬜      |
| TC-ENG-129-02 | Print at 1:1        | High     | Printer or plotter shop | Print `skirt-m.svg` at 100%; measure the scale square and the hip width of the front | Square 100 mm (± 1 mm); front hip (stitch line) = (hip + 50) / 4 for size M (± 1 mm)               | `packages/engine/src/blocks/skirt/draft-skirt-half.test.ts` | ⬜  | ⬜      |
| TC-ENG-129-03 | Seam allowances     | Medium   | Printed sheet           | Measure stitch to cut at waist, side, hem and centre front                           | 15, 15, 30 mm; 0 at the centre front fold                                                          | `packages/engine/src/blocks/skirt/skirt-module.test.ts`     | ⬜  | ⬜      |
| TC-ENG-129-04 | Centre-back zip     | Medium   | Spec with `center-back` | Print the skirt with `closure.position: "center-back"`                               | Back says cut 2 (mirrored), 15 mm allowance on the centre back                                     | `packages/engine/src/blocks/skirt/skirt-module.test.ts`     | ⬜  | ⬜      |
| TC-ENG-129-05 | Apple body: no dart | Medium   | Waist wider than hip    | Draft a body whose waist is at least the hip                                         | No dart on either piece; the outline does not cross itself                                         | `packages/engine/src/blocks/skirt/draft-skirt-half.test.ts` | ⬜  | ⬜      |
| TC-ENG-129-06 | Toile in S, M, XXL  | High     | Calico, printed sheets  | Cut and sew front and back in 3 sizes; try on a body of each size                    | Side seams meet at waist and hem; hip and waist sit without pulling; notes logged in sew-tests.md  | manual only (`needs:sew-test`)                              | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
