# Plan #133: fit validation for seams, sleeve caps, circumferences, notches and darts

Plan comment: <https://github.com/merna550/tafsila/issues/133#issuecomment-6239584483>.

Plan wave M2, 2026-10-17. Depends on #126, #131 and #132.

## Approach

Add deterministic core rules for FR-VAL-01, -02, -03, -04 and -07. Rules report bilingual checks with measured and expected millimetres plus stable geometry refs; they never repair geometry. Pieces declare body lines so circumference is measured from finished geometry, with darts closed and fold/cut multiplicity applied.

## Files

- Extend `packages/schemas/src/pattern.ts` and the generated JSON Schema with body-line, sleeve-cap, reversed-pair and dart-limit metadata.
- Put all SRS tolerances in `packages/engine/src/constants/validation.ts`.
- Add geometry-based body-line measurement in `packages/engine/src/pieces/body-lines.ts` and reuse `edgeLengthMm(..., { closeDarts: true })`.
- Add and register rules under `packages/engine/src/validation/rules/`; extend the bilingual message catalogue.
- Declare bust/waist/hip lines on the current bodice and skirt blocks and keep shared fixtures schema-valid.
- Update focused, property/integration tests, engine docs, SRS contract, manual cases and handbook.

## Tests

- Passing and failing fixtures for every tolerance, declared ease, reversed notch direction and broken refs.
- Size-matrix/property coverage for applicable bodice and skirt rules; fixture properties until sleeve/notch blocks are available.
- Pipeline integration preserves FR-VAL-05, -06 and -08 and worst-status aggregation.
- `pnpm quality && pnpm test`.

## Risks

- Pair declarations are reciprocal, so validators canonicalise them and emit one deterministic row.
- Fold and mirrored cutting instructions can double-count; one tested helper owns the multiplier.
- #131's notch-generation commit is not on `main`; FR-VAL-04 is contract- and fixture-backed now and applies to generated notches when that metadata lands.
