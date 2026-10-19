# Test cases — Waistbands (straight, contour, elastic) and waist facings

| Field        | Value                                            |
| ------------ | ------------------------------------------------ |
| Issue        | #140                                             |
| SRS          | FR-PAT-05, FR-PAT-07, FR-VAL-01, FR-VAL-08       |
| Area         | engine                                           |
| Last updated | 2026-10-19 (by PR for #140)                      |

## Test data

Design fixtures `straightBandSkirt` (straight band, centre-back zip), `contourBandSkirt` (A-line, side zip), `elasticGatheredSkirt` and `elasticStraightSkirt` (no closure), `straightKneeSkirt` and `pleatedKneeSkirt` (`waistband: "none"`). Sizes from `SIZE_MATRIX`. Snapshots: `packages/engine/src/modules/waistband/__snapshots__/waistband-SVG-*.svg` (every chart size, plus side and centre-back closure variants).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID              | Title                         | Priority | Preconditions          | Steps                                                                                       | Expected result                                                                                                                                         | Automated by                                                       | dev | staging |
| --------------- | ----------------------------- | -------- | ---------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --- | ------- |
| TC-WAIST-140-01 | Straight band                 | High     | Repo checked out       | Open `waistband-SVG-straightBandSkirt-size-m.svg`; read the report                          | One band 70 mm high (35 mm folded) as long as the skirt waist plus a 30 mm underlap, with a 35 mm interfacing; `WAISTBAND_LENGTH_OK` names the overlap | `packages/engine/src/modules/waistband/waistband.test.ts`          | ⬜  | ⬜      |
| TC-WAIST-140-02 | Contour band                  | High     | Repo checked out       | Open `waistband-SVG-contourBandSkirt-size-m.svg`                                            | Front and back bands curve with the waist, 50 mm high, each with a band facing and an interfacing, cut on the fold like the skirt                       | `packages/engine/src/modules/waistband/waistband.property.test.ts` | ⬜  | ⬜      |
| TC-WAIST-140-03 | Elastic casing and cut length | High     | Repo checked out       | Draft `elasticGatheredSkirt` for size M; read `notions` and the casing                      | Casing 60 mm high and as long as the ungathered skirt top; `notions` holds `waist-elastic` with length = waist × 0.9 and width 25 mm                     | `packages/engine/src/modules/waistband/waistband.test.ts`          | ⬜  | ⬜      |
| TC-WAIST-140-04 | No band: waist facing         | High     | Repo checked out       | Open `straight-skirt-SVG-snapshot-straight-skirt-size-m.svg`                                | Front and back waist facings 60 mm deep, traced with the dart closed, each with interfacing; the facing waist matches the skirt (± 2 mm)                 | `packages/engine/src/modules/waistband/waistband.test.ts`          | ⬜  | ⬜      |
| TC-WAIST-140-05 | Hip warning                   | High     | Repo checked out       | Draft `elasticStraightSkirt` and `elasticGatheredSkirt` for size M; read the reports        | Straight: `WAIST_HIP_PASS_TIGHT` warn in Arabic and English; gathered: `WAIST_HIP_PASS_OK`                                                               | `packages/engine/src/modules/waistband/waistband.property.test.ts` | ⬜  | ⬜      |
| TC-WAIST-140-06 | Straight band toiles, 3 sizes | High     | Calico, printed sheets | Sew `straightBandSkirt` in S, M, XXL (sew-test follow-up #212)                              | The band sews to the waist with no ease or shortfall and lies flat; fit notes logged in sew-tests.md                                                    | manual only (`needs:sew-test`)                                     | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
