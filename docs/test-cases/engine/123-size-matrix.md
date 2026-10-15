# Test cases — Size matrix

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #123                        |
| SRS          | SRS §11, NFR-10, FR-MEAS-03 |
| Area         | engine                      |
| Last updated | 2026-10-15 (by PR for #123) |

## Test data

`SIZE_MATRIX` and `arbMeasurements()` from `@tafsila/test-fixtures`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                         | Priority | Preconditions | Steps                                   | Expected result                         | Automated by                                           | dev | staging |
| ------------- | ----------------------------- | -------- | ------------- | --------------------------------------- | --------------------------------------- | ------------------------------------------------------ | --- | ------- |
| TC-ENG-123-01 | Matrix has 25 unique entries  | High     | None          | Count entries and ids                   | 5 chart + 20 synthetic, ids unique      | `packages/engine/src/measurements/size-matrix.test.ts` | ⬜  | ⬜      |
| TC-ENG-123-02 | Every entry passes validation | High     | None          | Run `validateMeasurements` on each      | No errors (warnings allowed)            | `packages/engine/src/measurements/size-matrix.test.ts` | ⬜  | ⬜      |
| TC-ENG-123-03 | Edge body types present       | Medium   | None          | Look up petite, tall, pear, apple, etc. | Each type has an entry                  | `packages/engine/src/measurements/size-matrix.test.ts` | ⬜  | ⬜      |
| TC-ENG-123-04 | Generated sets are valid      | High     | None          | 1000 runs of `arbMeasurements()`        | No generated set has a validation error | `packages/engine/src/measurements/size-matrix.test.ts` | ⬜  | ⬜      |
