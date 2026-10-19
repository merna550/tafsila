# Test cases — Sleeve styles (cap, puff, bishop, flutter) and cuffs (band, elastic)

| Field        | Value                           |
| ------------ | ------------------------------- |
| Issue        | #142                            |
| SRS          | FR-PAT-05, FR-VAL-01, FR-VAL-02 |
| Area         | engine                          |
| Last updated | 2026-10-19 (by PR for #142)     |

## Test data

Design fixtures `puffSleeveBlouse` (puff, short, band), `bishopSleeveBlouse` (bishop, long, band), `capSleeveBlouse` (cap, short), `flutterSleeveBlouse` (flutter, short); tests set other lengths and cuffs on the seed blouse. Sizes from `SIZE_MATRIX`. Snapshots: `packages/engine/src/modules/sleeve/__snapshots__/` (every chart size; set-in long band and puff elbow elastic at size-m). Print: `pnpm engine:print puffSleeveBlouse size-m`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                        | Priority | Preconditions    | Steps                                                                      | Expected result                                                                                                 | Automated by                                               | dev | staging |
| ------------- | ---------------------------- | -------- | ---------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --- | ------- |
| TC-ENG-142-01 | Puff gathers between notches | High     | Printed sheet    | Print `puffSleeveBlouse` size-m; pin the sleeve cap to the bodice armholes | Gather marks run only between the balance notches; the notches meet the bodice notches within 2 mm              | `packages/engine/src/modules/sleeve/sleeve-styles.test.ts` | ⬜  | ⬜      |
| TC-ENG-142-02 | Bishop open band cuff        | High     | Printed sheet    | Print `bishopSleeveBlouse` size-s; measure the cuff and the hem            | Cuff sewn edge = wrist + 20 mm, plus a 20 mm overlap; a 75 mm slit on the back half of the hem; a placket strip | `packages/engine/src/modules/sleeve/cuff.test.ts`          | ⬜  | ⬜      |
| TC-ENG-142-03 | Cap sleeve ends              | High     | Printed sheet    | Print `capSleeveBlouse` size-xxl; lay the sleeve on the bodice armholes    | The sleeve ends land on the bodice "sleeve ends" marks; the underarm below them is left for binding             | `packages/engine/src/modules/sleeve/sleeve-styles.test.ts` | ⬜  | ⬜      |
| TC-ENG-142-04 | Flutter ruffle               | Medium   | Printed sheet    | Print `flutterSleeveBlouse` size-m                                         | A half-circle ruffle 150 mm deep; its inner edge eases onto the armhole between the notches                     | `packages/engine/src/modules/sleeve/sleeve-styles.test.ts` | ⬜  | ⬜      |
| TC-ENG-142-05 | Elastic cut length           | Medium   | Repo checked out | Draft the seed blouse with a puff elbow sleeve and an elastic cuff         | The pattern lists the sleeve elastic (cut 2) with its cut length; the casing is as long as the sleeve hem       | `packages/engine/src/modules/sleeve/cuff.test.ts`          | ⬜  | ⬜      |
| TC-ENG-142-06 | Refused combination          | High     | Repo checked out | Draft a bishop sleeve with no cuff; read the report                        | No pieces; `SLEEVE_CUFF_UNSUPPORTED` fail with an Arabic and an English message                                 | `packages/engine/src/modules/sleeve/combinations.test.ts`  | ⬜  | ⬜      |
| TC-ENG-142-07 | Puff and bishop toiles       | Medium   | Calico toiles    | Sew puff and bishop in size-s, size-m, size-xxl (sew-test follow-up)       | The heads puff evenly and the cuffs fit; fit notes logged in sew-tests.md                                       | manual only (`needs:sew-test`)                             | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
