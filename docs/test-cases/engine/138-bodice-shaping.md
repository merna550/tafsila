# Test cases — Bodice shaping: princess seams and dart-free

| Field        | Value                                                 |
| ------------ | ----------------------------------------------------- |
| Issue        | #138                                                  |
| SRS          | FR-PAT-05, FR-VAL-01, FR-VAL-03, FR-VAL-04, FR-VAL-08 |
| Area         | engine                                                |
| Last updated | 2026-10-18 (by PR for #138)                           |

## Test data

Design fixtures `princessShoulderBlouse` (fitted, no sleeves), `princessArmholeBlouse` (fitted, long set-in sleeves) and `dartFreeLooseBlouse` (loose). Sizes from `SIZE_MATRIX`. Snapshots: `packages/engine/src/modules/bodice/__snapshots__/bodice-shaping-SVG-*.svg` (every chart size).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID               | Title                      | Priority | Preconditions          | Steps                                                                                | Expected result                                                                                                                             | Automated by                                                   | dev | staging |
| ---------------- | -------------------------- | -------- | ---------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --- | ------- |
| TC-BODICE-138-01 | Princess from the shoulder | High     | Repo checked out       | Open `bodice-shaping-SVG-princessShoulderBlouse-size-m.svg`                          | Four pieces: centre front and centre back on the fold, side front and side back cut 2; the style line starts mid-shoulder; no darts         | `packages/engine/src/modules/bodice/princess.test.ts`          | ⬜  | ⬜      |
| TC-BODICE-138-02 | Princess from the armhole  | High     | Repo checked out       | Open the `princessArmholeBlouse-size-m` snapshot                                     | The style line leaves the armhole about a third down; the shoulder is whole on the centre panels; the sleeve notches sit on the side panels | `packages/engine/src/modules/bodice/princess.test.ts`          | ⬜  | ⬜      |
| TC-BODICE-138-03 | Loose dart-free            | Medium   | Repo checked out       | Open the `dartFreeLooseBlouse-size-m` snapshot; read the report of `generatePattern` | Front and back with no darts; the front side waist sits higher than the centre front; FR-VAL-08 `BODICE_DART_FREE_OK` passes                | `packages/engine/src/modules/bodice/dart-free.test.ts`         | ⬜  | ⬜      |
| TC-BODICE-138-04 | Fitted dart-free warning   | Medium   | Repo checked out       | Draft `dartFreeLooseBlouse` with `bodice.fit: fitted`                                | The pattern is drawn and the report is `warn` with `BODICE_DART_FREE_FITTED` in Arabic and English                                          | `packages/engine/src/modules/bodice/dart-free.test.ts`         | ⬜  | ⬜      |
| TC-BODICE-138-05 | Bust notch alignment       | High     | Printed size M sheet   | Lay the side front on the centre front along the princess seam from the waist        | The `princess-bust` notches meet (± 2 mm); the seam ends meet at the shoulder or armhole (± 2 mm)                                           | `packages/engine/src/modules/bodice/princess.property.test.ts` | ⬜  | ⬜      |
| TC-BODICE-138-06 | Toiles in 3 sizes          | High     | Calico, printed sheets | Sew each princess variant in S, M, XXL (#208)                                        | Seams sew flat over the bust; bust and waist fit; fit notes logged in sew-tests.md                                                          | manual only (`needs:sew-test`, #208)                           | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
