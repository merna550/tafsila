# Test cases — Seam allowance and the cutting line

| Field        | Value                        |
| ------------ | ---------------------------- |
| Issue        | #130                         |
| SRS          | FR-PAT-03, FR-VAL-05, NFR-01 |
| Area         | engine                       |
| Last updated | 2026-10-17 (by PR for #130)  |

## Test data

Command `pnpm engine:print seam-rectangle size-m --out seam.svg`: the 200 x 300 mm test rectangle run through the pipeline, with edges waist (top, `other`), side (right), hem (bottom) and centre front on the fold (left).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title               | Priority | Preconditions | Steps                                                                      | Expected result                                                         | Automated by                                           | dev | staging |
| ------------- | ------------------- | -------- | ------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ | --- | ------- |
| TC-ENG-130-01 | Side and waist SA   | High     | Printed sheet | Print `seam.svg` at 100%; measure stitch to cut at the side and at the top | 15 mm at the side and at the top (plus or minus 1 mm)                   | `packages/engine/src/finishing/seam-allowance.test.ts` | ⬜  | ⬜      |
| TC-ENG-130-02 | Hem SA              | High     | Printed sheet | Measure stitch to cut at the bottom edge                                   | 30 mm (plus or minus 1 mm)                                              | `packages/engine/src/finishing/seam-allowance.test.ts` | ⬜  | ⬜      |
| TC-ENG-130-03 | Fold edge           | High     | Printed sheet | Look at the left edge                                                      | The cut line runs on the stitch line (no allowance)                     | `packages/engine/src/finishing/seam-allowance.test.ts` | ⬜  | ⬜      |
| TC-ENG-130-04 | Hem corner folds up | Medium   | Printed sheet | Cut along the cut line, fold the hem up on the stitch line                 | The hem allowance edge lies on the side cut line, no step at the corner | `packages/engine/src/geometry/mirror-corner.test.ts`   | ⬜  | ⬜      |
