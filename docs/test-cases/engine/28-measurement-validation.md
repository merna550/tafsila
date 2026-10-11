# Test cases — Measurement validation and standard sizes

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #28                        |
| SRS          | FR-MEAS-01, -03, -05       |
| Area         | engine                     |
| Last updated | 2026-10-11 (by PR for #28) |

## Test data

Demo size chart S-XXL from `@tafsila/test-fixtures` (`demoSizeChart`, built from size M; not the real Egyptian chart, see #32).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                             | Priority | Preconditions | Steps                                          | Expected result                                                  | Automated by                               | dev | staging |
| ------------ | --------------------------------- | -------- | ------------- | ---------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------ | --- | ------- |
| TC-ENG-28-01 | Impossible combination blocks     | High     | Size M        | Set high bust above bust and validate          | One error `MEAS_HIGH_BUST_EXCEEDS_BUST`, Arabic and English text | `validate-measurements.test.ts`            | ⬜  | ⬜      |
| TC-ENG-28-02 | Suspicious combination only warns | High     | Size M        | Set waist equal to hip and validate            | A warning `MEAS_WAIST_NOT_BELOW_HIP`, no error                   | `validate-measurements.test.ts`            | ⬜  | ⬜      |
| TC-ENG-28-03 | Every standard size is accepted   | High     | Demo chart    | Validate each of S, M, L, XL, XXL              | No errors and no warnings                                        | `validate-measurements.test.ts` (property) | ⬜  | ⬜      |
| TC-ENG-28-04 | Arabic wording reads well         | Medium   | Merna reviews | Read every `message_ar` in `codes.ts`          | Clear, polite Arabic a seamstress understands                    | manual only                                | ⬜  | ⬜      |
| TC-ENG-28-05 | Override changes only given keys  | High     | Demo chart    | `fromStandardSize(chart, "M", { waist: 800 })` | Only waist differs from M; chart unchanged                       | `from-standard-size.test.ts` (property)    | ⬜  | ⬜      |
| TC-ENG-28-06 | Range edges                       | High     | Size M        | Set a measurement to min, max, min-1, max+1    | Edges pass, outside values give `MEAS_OUT_OF_RANGE`              | `validate-measurements.test.ts`            | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
