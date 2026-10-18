# Test cases — Bodice block

| Field        | Value                                                  |
| ------------ | ------------------------------------------------------ |
| Issue        | #128                                                   |
| SRS          | FR-PAT-01, FR-PAT-05, FR-VAL-01, -03, -05, -07, NFR-01 |
| Area         | engine                                                 |
| Last updated | 2026-10-17 (by PR for #128)                            |

## Test data

`egyptianSizeChart` S, M, XXL and the 25 bodies of `SIZE_MATRIX` (`@tafsila/test-fixtures`); seed design `dartedBlouse`; reference points in `referenceDrafts`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                                      | Priority | Preconditions                    | Steps                                                                                                                                  | Expected result                                                              | Automated by                                      | dev | staging |
| ------------- | ---------------------------------------------------------- | -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- | --- | ------- |
| TC-ENG-128-01 | Key points match the reference for S, M and XXL (± 1 mm)   | High     | none                             | Draft S, M, XXL with regular ease, semi-fitted                                                                                         | All 26 key points within 1 mm (in fact within 0.06 mm)                       | `blocks/bodice/draft-bodice.test.ts`              | ✅  | ⬜      |
| TC-ENG-128-02 | Shoulder and side seams match across the matrix (2 mm)     | High     | none                             | 225 cases: 25 bodies x 3 ease profiles x 3 fits                                                                                        | Front side (darts closed) = back side, back shoulder = front shoulder + ease | `blocks/bodice/bodice.property.test.ts`           | ✅  | ⬜      |
| TC-ENG-128-03 | Bust and waist circumference = measurement + ease (± 5 mm) | High     | none                             | Same 225 cases                                                                                                                         | Within 5 mm                                                                  | `blocks/bodice/bodice.property.test.ts`           | ✅  | ⬜      |
| TC-ENG-128-04 | Dart legs equal (± 1 mm), apexes not past the bust point   | High     | none                             | Same 225 cases                                                                                                                         | Legs within 1 mm; bust dart apex x ≥ BP x; waist dart apex y ≥ BP y          | `blocks/bodice/bodice.property.test.ts`           | ✅  | ⬜      |
| TC-ENG-128-05 | Bad proportions give a clear `fail`, no crash              | High     | none                             | Narrow shoulder + large neck; bust height 420 with short lengths; 200 random bodies                                                    | `fail` with a `BODICE_*` code and an Arabic message; never a throw           | `draft-bodice.test.ts`, `bodice.property.test.ts` | ✅  | ⬜      |
| TC-ENG-128-06 | Visual review of the M snapshot                            | Medium   | none                             | Open `packages/engine/src/blocks/bodice/__snapshots__/bodice-block-SVG-dartedBlouse-size-m.svg`                                        | Smooth armhole and neck, darts placed sensibly                               | manual only                                       | ⬜  | ⬜      |
| TC-ENG-128-07 | The 3 reference changes agree with the book                | High     | Merna's Aldrich 6th edition copy | Compare back step 3, front steps 7 and 9 of `docs/engine/drafting-method.md`, the armhole guide points 25/20 mm and the 6 mm dart rule | Same construction as the book, or the constant to change is named            | manual only (Merna)                               | ⬜  | ⬜      |
| TC-ENG-128-08 | Toile                                                      | High     | Plotter print shop, calico       | `pnpm engine:print dartedBlouse size-s` (then `size-m`, `size-xxl`), print at 100%, check the 10 cm square, sew                        | Fit notes logged in [sew-tests.md](sew-tests.md)                             | manual only (Merna)                               | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
