# Test cases — Closures (zip, buttons, none)

| Field        | Value                           |
| ------------ | ------------------------------- |
| Issue        | #143                            |
| SRS          | FR-PAT-05, FR-VAL-04, FR-VAL-08 |
| Area         | engine                          |
| Last updated | 2026-10-19 (by PR for #143)     |

## Test data

Design fixtures `centreBackZipDress`, `sideZipDress`, `centreFrontZipDress`, `buttonFrontDress`, `buttonFrontBlouse`, `noClosureDress` (straight knee dress or the seed blouse); `boatNeckBlouse` for the head check. Sizes from `SIZE_MATRIX`. Snapshots: `packages/engine/src/modules/closure/__snapshots__/` (size-s, size-m, size-xxl). Print: `pnpm engine:print centreBackZipDress size-m`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                        | Priority | Preconditions    | Steps                                                                                             | Expected result                                                                                                    | Automated by                                                   | dev | staging |
| ------------- | ---------------------------- | -------- | ---------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | --- | ------- |
| TC-ENG-143-01 | Centre-back zip              | High     | Printed sheet    | Print `centreBackZipDress` size-m                                                                 | Backs and back facing cut 2 mirrored; 20 mm allowance on the CB; zip-stop notch on the skirt back 560 mm from neck | `packages/engine/src/modules/closure/closure.test.ts`          | ⬜  | ⬜      |
| TC-ENG-143-02 | Side zip                     | High     | Printed sheet    | Print `sideZipDress` size-s                                                                       | Centres on the fold; 20 mm allowance on both side seams; zip-stop notches meet on front and back skirt sides       | `packages/engine/src/modules/closure/closure.property.test.ts` | ⬜  | ⬜      |
| TC-ENG-143-03 | Centre-front zip             | High     | Printed sheet    | Print `centreFrontZipDress` size-m                                                                | Fronts and front facing cut 2 mirrored with a CF seam; backs on the fold                                           | `packages/engine/src/modules/closure/closure.test.ts`          | ⬜  | ⬜      |
| TC-ENG-143-04 | Centre-front buttons         | High     | Printed sheet    | Print `buttonFrontDress` size-xxl                                                                 | 15 mm extension on every front piece; evenly spaced buttons and buttonholes on the CF; a front facing per piece    | `packages/engine/src/modules/closure/closure.property.test.ts` | ⬜  | ⬜      |
| TC-ENG-143-05 | No closure, head             | Medium   | Repo checked out | Draft `boatNeckBlouse`; read the report                                                           | `NECK_HEAD_OPENING_TIGHT` warning (the neck rule of #139)                                                          | `packages/engine/src/modules/neckline/neckline.test.ts`        | ⬜  | ⬜      |
| TC-ENG-143-06 | No closure, hips             | Medium   | Repo checked out | Draft `noClosureDress`; read the report                                                           | `CLOSURE_HIP_OPENING_TIGHT` warning with an Arabic and English message; pieces unchanged                           | `packages/engine/src/modules/closure/closure.test.ts`          | ⬜  | ⬜      |
| TC-ENG-143-07 | Refused buttons              | Medium   | Repo checked out | Draft the seed blouse with buttons at the side                                                    | No pieces; `CLOSURE_UNSUPPORTED` fail in both languages                                                            | `packages/engine/src/modules/closure/closure.test.ts`          | ⬜  | ⬜      |
| TC-ENG-143-08 | Cuff button                  | Medium   | Printed sheet    | Print `bishopSleeveBlouse` size-m                                                                 | The cuff has a button under the overlap and a buttonhole in it, meeting when lapped                                | `packages/engine/src/modules/closure/closure.test.ts`          | ⬜  | ⬜      |
| TC-ENG-143-09 | CB zip and CF buttons toiles | Medium   | Calico toiles    | Sew `centreBackZipDress` and `buttonFrontBlouse` in size-s, size-m, size-xxl (sew-test follow-up) | Zip sits flat to the stop; buttons line up; fit notes logged in sew-tests.md                                       | manual only (`needs:sew-test`)                                 | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
