# Test cases — Collars: peter pan, shirt (stand and fall) and mandarin

| Field        | Value                           |
| ------------ | ------------------------------- |
| Issue        | #141                            |
| SRS          | FR-PAT-05, FR-VAL-01, FR-VAL-04 |
| Area         | engine                          |
| Last updated | 2026-10-19 (by PR for #141)     |

## Test data

Design fixtures `peterPanBlouse` (round/round, centre-back zip: a mirrored pair), `shirtCollarBlouse` (round/round, centre-front buttons), `mandarinBlouse` (high-round/high-round, centre-front zip). Sizes from `SIZE_MATRIX`. Snapshots: `packages/engine/src/modules/collar/__snapshots__/collar-SVG-*.svg` (size-s, size-m, size-xxl). Print: `pnpm engine:print peterPanBlouse size-m`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID               | Title                           | Priority | Preconditions        | Steps                                                                  | Expected result                                                                                                    | Automated by                                                 | dev | staging |
| ---------------- | ------------------------------- | -------- | -------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | --- | ------- |
| TC-COLLAR-141-01 | Peter pan notches meet          | High     | Printed sheet        | Print `peterPanBlouse` size-m; pin the collar neck to the bodice necks | The collar CB, shoulder and CF notches meet the bodice notches (± 2 mm)                                            | `packages/engine/src/modules/collar/collar.property.test.ts` | ⬜  | ⬜      |
| TC-COLLAR-141-02 | Peter pan roll                  | Medium   | Calico toile         | Sew the peter pan toile (sew-test follow-up)                           | The collar rolls about 10 mm at the CB neck and lies flat at the front                                             | manual only (`needs:sew-test`)                               | ⬜  | ⬜      |
| TC-COLLAR-141-03 | Shirt stand and fall            | High     | Printed sheet        | Print `shirtCollarBlouse` size-m                                       | The stand runs 15 mm past CF to the button line; the fall's CB, shoulder and CF notches meet the stand top notches | `packages/engine/src/modules/collar/collar.test.ts`          | ⬜  | ⬜      |
| TC-COLLAR-141-04 | Mandarin stands up              | Medium   | Calico toiles        | Sew `mandarinBlouse` in size-s, size-m, size-xxl                       | The stand stands without gaping at CF in each size; fit notes logged in sew-tests.md                               | manual only (`needs:sew-test`)                               | ⬜  | ⬜      |
| TC-COLLAR-141-05 | Turn of cloth                   | Medium   | Printed sheet, toile | Compare `collar-upper` and `collar-under`; sew and turn                | The under collar is 3 mm smaller at the outer edge; the seam rolls under after turning                             | `packages/engine/src/modules/collar/collar.test.ts`          | ⬜  | ⬜      |
| TC-COLLAR-141-06 | Refused combination             | High     | Repo checked out     | Draft `shirtCollarBlouse` with `neckline.front: "v"`; read the report  | No pieces; `COLLAR_NECKLINE_UNSUPPORTED` fail with an Arabic and an English message                                | `packages/engine/src/modules/collar/combinations.test.ts`    | ⬜  | ⬜      |
| TC-COLLAR-141-07 | Facings with and without stands | High     | Repo checked out     | Draft the three seed designs; list the pieces                          | Shirt and mandarin have no neck facings; peter pan has the front and back facings and their interfacings           | `packages/engine/src/modules/collar/collar.test.ts`          | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
