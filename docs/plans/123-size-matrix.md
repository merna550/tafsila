# Plan #123: size matrix, S-XXL plus 20 custom measurement sets

Plan label: `plan:none` (size S test fixture).

## Approach

- `packages/test-fixtures/src/size-matrix.ts`: `SIZE_MATRIX` (5 chart entries read from `egyptianSizeChart`, 20 `synthetic` custom sets built as chart size plus overrides) and `arbMeasurements()`.
- `test-fixtures` cannot import the engine (the engine depends on it), so `arbMeasurements()` keeps its own ranges inside the engine's hard ranges and builds the order rules by construction (gaps for high bust, under bust and front length). The checks live in `packages/engine/src/measurements/size-matrix.test.ts`.
- `fast-check` added to `test-fixtures` dependencies.

## Decision

None needed: reversible fixture design (data-only swap to `source: "real"`).
