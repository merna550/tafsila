# Test cases — Necklines (front and back styles, depth override) with facings

| Field        | Value                                                 |
| ------------ | ----------------------------------------------------- |
| Issue        | #139                                                  |
| SRS          | FR-PAT-05, FR-PAT-07, FR-VAL-01, FR-VAL-05, FR-VAL-08 |
| Area         | engine                                                |
| Last updated | 2026-10-18 (by PR for #139)                           |

## Test data

Design fixtures `dartedBlouse` (round / round), `vNeckBlouse`, `squareNeckBlouse`, `sweetheartNeckBlouse`, `boatNeckBlouse` (no closure) and `highRoundNeckBlouse`. Sizes from `SIZE_MATRIX`. Snapshots: `packages/engine/src/modules/neckline/__snapshots__/neckline-SVG-*.svg` (every chart size, plus a princess bodice with a 160 mm V override).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                    | Priority | Preconditions          | Steps                                                                                             | Expected result                                                                                                                            | Automated by                                                     | dev | staging |
| -------------- | ------------------------ | -------- | ---------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | --- | ------- |
| TC-NECK-139-01 | Round neck               | High     | Repo checked out       | Open `bodice-block-SVG-dartedBlouse-size-m.svg`                                                   | The neck is square to the centre front and to the shoulder; front and back facings and their interfacing are drawn                         | `packages/engine/src/modules/neckline/neckline.test.ts`          | ⬜  | ⬜      |
| TC-NECK-139-02 | V neck                   | High     | Repo checked out       | Open `neckline-SVG-vNeckBlouse-size-m.svg`                                                        | Front and back V run straight from the centre and turn square into the shoulder; the shoulder seams still match                            | `packages/engine/src/modules/neckline/neckline.test.ts`          | ⬜  | ⬜      |
| TC-NECK-139-03 | Square and sweetheart    | High     | Repo checked out       | Open the `squareNeckBlouse-size-m` and `sweetheartNeckBlouse-size-m` snapshots                    | Square: level then straight up; sweetheart: a dip at the centre front, a lobe, then up the strap; facings follow without loops             | `packages/engine/src/modules/neckline/neckline.property.test.ts` | ⬜  | ⬜      |
| TC-NECK-139-04 | Boat and high-round      | Medium   | Repo checked out       | Open the `boatNeckBlouse-size-m` and `highRoundNeckBlouse-size-m` snapshots; read the boat report | Boat: wide and shallow, the back widened by the same amount; the report warns `NECK_HEAD_OPENING_TIGHT` (no closure) in Arabic and English | `packages/engine/src/modules/neckline/neckline.test.ts`          | ⬜  | ⬜      |
| TC-NECK-139-05 | Depth override and clamp | High     | Repo checked out       | Draft `dartedBlouse` with `neckline.depthFrontMm` 150, then 10, then 400                          | 150: drafted exactly, `NECK_DEPTH_OK`; 10 and 400: drafted at the limit, report `warn` with `NECK_FRONT_DEPTH_CLAMPED` naming both depths  | `packages/engine/src/modules/neckline/neckline.test.ts`          | ⬜  | ⬜      |
| TC-NECK-139-06 | Facing and interfacing   | High     | Printed size M sheet   | Lay the front facing on the bodice front along the neck; then the interfacing on the facing       | The facing neck matches the bodice neck (± 2 mm), the band is 60 mm wide, both are cut 1 on the fold; the interfacing matches the facing   | `packages/engine/src/modules/neckline/neckline.property.test.ts` | ⬜  | ⬜      |
| TC-NECK-139-07 | Toiles in 3 sizes        | High     | Calico, printed sheets | Sew round, V and sweetheart in S, M, XXL (sew-test follow-up issue)                               | The neck lies flat, the shoulder join is smooth, the facing turns in without pulling; fit notes logged in sew-tests.md                     | manual only (`needs:sew-test`)                                   | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
