# Plan #28: Measurement validation, standard sizes and size+override merge

Issue: #28 · plan:sonnet · build:sonnet · Milestone: M1 - Accounts & data · size:S

No dependencies. Pure code in `packages/schemas`, `packages/engine` and `packages/test-fixtures`. FR-MEAS-01, -03, -05.

## Approach

Add a `measurements` module to the engine: named ranges (one per measurement), cross-check rules, a validation function that returns bilingual errors and warnings, and a merge function that starts from a standard size. Nothing touches I/O. The API (#29) and the form (#31) call these functions; the database does not repeat the ranges.

## Files to create or change

- `packages/schemas/src/size-chart.ts`: `sizeChartSchema` = non-empty record of size label (string, not an enum, so sizes beyond XXL are data only, ADR-024) to `measurementsSchema`; type `SizeChart`. Export from `index.ts`.
- `packages/engine/src/measurements/ranges.ts`: `MEASUREMENT_RANGES_MM` (min, max, one-line reason each).
- `packages/engine/src/measurements/codes.ts`: stable issue codes and bilingual messages (`message_ar`, `message_en`).
- `packages/engine/src/measurements/validate-measurements.ts`: `validateMeasurements(m)` returns `{ errors, warnings }`; each item has `code`, `fields`, `message_ar`, `message_en`.
- `packages/engine/src/measurements/from-standard-size.ts`: `fromStandardSize(chart, label, overrides)`.
- `packages/engine/src/measurements/index.ts`, re-exported from `packages/engine/src/index.ts`.
- `packages/test-fixtures/src/size-chart.ts`: demo chart S-XXL (built from the existing `sizeM`), exported from the fixtures index.
- Tests next to each file; property tests with fast-check (already a dependency of the engine).
- Docs: `docs/engine/README.md` (measurement validation section), `docs/test-cases/engine/28-measurement-validation.md`, `docs/decisions/28-measurement-validation.md`.

## Rules (proposed, Merna reviews: this is sewing knowledge)

Hard ranges in mm, per measurement; outside the range is an **error**. They are tighter than the schema's generic 50-2500 mm limits.

| Measurement       | Min  | Max  | Why                               |
| ----------------- | ---- | ---- | --------------------------------- |
| height            | 1400 | 2000 | adult women's height              |
| bust              | 700  | 1500 | smallest adult to plus sizes      |
| highBust          | 650  | 1400 | always a little below bust        |
| underBust         | 600  | 1300 | below bust                        |
| waist             | 500  | 1400 |                                   |
| hip               | 800  | 1700 |                                   |
| hipDepth          | 120  | 280  | waist to hip line                 |
| neck              | 250  | 500  |                                   |
| shoulderWidth     | 280  | 520  |                                   |
| backLength        | 300  | 550  | nape to waist                     |
| frontLength       | 320  | 600  | shoulder point over bust to waist |
| bustPointDistance | 120  | 300  | between bust points               |
| bustHeight        | 150  | 420  | shoulder point to bust point      |
| armLength         | 400  | 750  |                                   |
| upperArm          | 180  | 500  |                                   |
| wrist             | 110  | 260  |                                   |
| waistToKnee       | 400  | 800  |                                   |
| waistToFloor      | 700  | 1300 |                                   |

Cross-checks:

| Rule                                      | Severity                                         |
| ----------------------------------------- | ------------------------------------------------ |
| highBust > bust                           | error                                            |
| underBust >= bust (when present)          | error                                            |
| waistToKnee >= waistToFloor               | error                                            |
| waist >= hip                              | warning (SRS: "waist < hip for most bodies")     |
| bustPointDistance > bust / 2              | warning                                          |
| frontLength < backLength                  | warning (front is normally longer over the bust) |
| waistToFloor outside 50% to 70% of height | warning                                          |

Codes are stable strings, one per rule (for example `MEAS_OUT_OF_RANGE` with the field in `fields`, `MEAS_HIGH_BUST_EXCEEDS_BUST`, `MEAS_WAIST_NOT_BELOW_HIP`). They are engine report codes, separate from the API error catalogue; the API (#29) puts them in `details`.

`fromStandardSize(chart, label, overrides)` returns a new `Measurements`: the chart row with `overrides` on top; keys that are `undefined` in `overrides` do not erase values; an unknown label throws a typed `UnknownSizeError` (the UI only offers charted sizes, so it is a programming error). The inputs are never mutated.

## Tests

- Unit: each range edge (min, max, one below, one above) fails or passes as stated; each cross-check triggers on the boundary and not below it; messages exist in both languages and codes are unique.
- Property (fast-check): every size of the demo chart passes validation with no errors and no warnings; for any valid base size and any subset of in-range overrides, only the overridden keys differ and the base object is unchanged; `validateMeasurements` is deterministic (same input, same output).
- Coverage of `packages/engine` stays at or above 85% (NFR-10).
- Draft manual cases: TC-ENG-28-01 impossible combination blocks (high bust above bust); TC-ENG-28-02 suspicious combination only warns (waist above hip); TC-ENG-28-03 every standard size is accepted; TC-ENG-28-04 Arabic wording read by Merna.

## Decisions (written by the build as `docs/decisions/28-measurement-validation.md`)

1. Size labels are free strings in `sizeChartSchema`, not an enum (ADR-024: more sizes later are data only).
2. The ranges live only in the engine; the database and API reuse these functions.
3. Unknown size label throws a typed error; invalid measurements are returned as data, never thrown.

## Docs to update

`docs/engine/README.md`, SRS FR-MEAS-03 (list of cross-checks), test cases file, decision file, handbook learning log.

## Risks

- Wrong ranges either block real bodies or let nonsense through: the numbers above are a proposal, and Merna's approval of the ranges is already an acceptance criterion (comment in the PR). Warnings never block, so a too-strict cross-check costs a warning, not a user.
- The demo chart is not the real Egyptian chart (Merna supplies it, #32); tests must not hard-code its values beyond "passes validation".

## Model and flags

Plan: sonnet. Build: sonnet. The `needs:sew-test` label is not needed: it applies to pattern geometry, and this module draws nothing; the ranges are reviewed by Merna instead. I remove that label. `needs:interactive`: no. Status stays `status:plan-review` until Merna approves.
