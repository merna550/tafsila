# Test cases — Nesting piece preparation

| Field        | Value                                      |
| ------------ | ------------------------------------------ |
| Issue        | #315                                       |
| SRS          | FR-FAB-01, FR-FAB-02, FR-FAB-05, FR-VAL-08 |
| Area         | engine                                     |
| Last updated | 2026-10-28 (by PR #328)                    |

## Test data

No accounts needed: the cases use the fixture designs of `@tafsila/test-fixtures` through `pnpm --filter @tafsila/nesting print <fixture> [folded|open] [widthCm] [size]`.

| Name    | Value                                              |
| ------- | -------------------------------------------------- |
| Designs | `seedDress`, `vNeckHalfCircleDress` (circle skirt) |
| Sizes   | M, XXL                                             |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                  | Priority | Preconditions    | Steps                                                                          | Expected result                                                                                                                                                              | Automated by                                 | dev | staging |
| ------------- | -------------------------------------- | -------- | ---------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --- | ------- |
| TC-FAB-315-01 | Layout rules match how Merna cuts      | High     | None             | 1. Open `docs/engine/nesting.md`. 2. Read the two drawings and the table.      | Fold pieces sit on the fold when folded and are whole when open; a pair is cut once folded and twice (one flipped) open.                                                     | manual only                                  | ⬜  | ⬜      |
| TC-FAB-315-02 | Seed dress shapes on 140 cm folded     | High     | Repo checked out | 1. `pnpm --filter @tafsila/nesting print seedDress folded 140 M`.              | 7 main shapes (bodice and skirt fronts and the front facing marked "fold", one shape each for the back, sleeve and facing pairs) and 2 interfacing shapes; nothing reported. | `prepare-pieces.property.test.ts` (snapshot) | ⬜  | ⬜      |
| TC-FAB-315-03 | Circle skirt too wide on 115 cm folded | High     | Repo checked out | 1. `pnpm --filter @tafsila/nesting print vNeckHalfCircleDress folded 115 XXL`. | `skirt-front` and `skirt-back` reported as "does not fit" with their widths, and "suggest: open layout".                                                                     | `prepare-pieces.test.ts` (does not fit)      | ⬜  | ⬜      |
| TC-FAB-315-04 | Open layout pairs and unfolded pieces  | Medium   | Repo checked out | 1. `pnpm --filter @tafsila/nesting print setInSleeveBlouse open 140 M`.        | Every pair appears twice, the second one "mirrored"; the bodice front is one whole shape, not marked "fold".                                                                 | `prepare-pieces.test.ts` (mirrored pairs)    | ⬜  | ⬜      |

Every case covers one of: happy path, validation/errors, permissions (other user's data), edge values (min/max sizes), RTL/Arabic display, mobile width, and for engine features: physical sew test (`needs:sew-test`).

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
