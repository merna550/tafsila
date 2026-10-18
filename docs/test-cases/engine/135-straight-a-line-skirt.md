# Test cases — Straight and A-line skirts, lengths and slit

| Field        | Value                                      |
| ------------ | ------------------------------------------ |
| Issue        | #135                                       |
| SRS          | FR-PAT-05, FR-VAL-01, FR-VAL-03, FR-VAL-08 |
| Area         | engine                                     |
| Last updated | 2026-10-18 (by PR for #135)                |

## Test data

Design fixtures `straightKneeSkirt`, `straightMidiSkirt`, `aLineMidiSkirt`, `straightMidiBackSlitSkirt` and `aLineAnkleSideSlitSkirt`. Sizes from `SIZE_MATRIX`. Snapshots: `packages/engine/src/modules/skirt/__snapshots__/`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID              | Title                      | Priority | Preconditions          | Steps                                                                      | Expected result                                                                                      | Automated by                                       | dev | staging |
| --------------- | -------------------------- | -------- | ---------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --- | ------- |
| TC-SKIRT-135-01 | Straight knee, size M      | High     | Repo checked out       | Open the `straight-knee-size-m` snapshot                                   | Front and back with waist darts, side seams straight below the hip; no walking warning               | `packages/engine/src/modules/skirt/module.test.ts` | ⬜  | ⬜      |
| TC-SKIRT-135-02 | A-line midi, size M        | High     | Repo checked out       | Open the `aLineMidiSkirt-size-m` snapshot; measure waist, hip line and hem | No darts; waist curves up a little at the side; hip line same as the block; hem wider, curving up    | `packages/engine/src/modules/skirt/a-line.test.ts` | ⬜  | ⬜      |
| TC-SKIRT-135-03 | Back slit                  | High     | Repo checked out       | Open the `straightMidiBackSlitSkirt-size-m` snapshot                       | Back cut 2 with a CB seam; 40 mm extension with 45° top; notch at the slit top, 200 mm above the hem | `packages/engine/src/modules/skirt/slit.test.ts`   | ⬜  | ⬜      |
| TC-SKIRT-135-04 | Side slit                  | Medium   | Repo checked out       | Open the `aLineAnkleSideSlitSkirt-size-m` snapshot                         | Both side seams have the extension and a notch at the same distance from the waist                   | `packages/engine/src/modules/skirt/module.test.ts` | ⬜  | ⬜      |
| TC-SKIRT-135-05 | Walking-ease warning       | Medium   | Repo checked out       | Draft `straightMidiSkirt` in size M and read the report                    | FR-VAL-08 warning "narrower than the 1300 mm needed to walk"; none with a slit or at the knee        | `packages/engine/src/modules/skirt/module.test.ts` | ⬜  | ⬜      |
| TC-SKIRT-135-06 | Slit above the hip         | Medium   | Repo checked out       | Draft a knee straight skirt with a 600 mm back slit                        | FR-VAL-08 fails `SLIT_ABOVE_HIP`; no slit is cut                                                     | `packages/engine/src/modules/skirt/module.test.ts` | ⬜  | ⬜      |
| TC-SKIRT-135-07 | A-line midi toile, 3 sizes | High     | Calico, printed sheets | Cut and sew the A-line midi in S, M and XXL                                | Waist and hip sit without pulling; side seams meet; hem hangs evenly; notes logged in sew-tests.md   | manual only (`needs:sew-test`)                     | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
