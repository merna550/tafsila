# Plan #121: PatternResult, Piece, Path and engine options schemas

Plan comment: <https://github.com/merna550/tafsila/issues/121#issuecomment-6155681474>.

Plan wave M2 (2026-10-13). Reopened: the issue was closed by mistake by PR #151 ("Closes #121"); nothing in its scope is on `main`.

## Approach

Write the engine output contract as Zod schemas in `packages/schemas`, following SRS §6.3. Lengths are in mm, and every numeric field name carries its unit. Path closure is checked by a refinement, not in TypeScript, so a stored pattern that is open fails to parse. The JSON Schema is generated with Zod 4's built-in `z.toJSONSchema`, so no new dependency is needed.

## Files

- `packages/schemas/src/pattern.ts` (new):
  - `pointSchema` `{ x, y }`.
  - `segmentSchema`: `line { kind, from, to }` or `cubic { kind, from, c1, c2, to }`.
  - `pathSchema`: an array of segments, each starting where the previous one ends (± `PATH_JOIN_TOLERANCE_MM` = 0.01). `closedPathSchema` also requires the last end to equal the first start.
  - `edgeSchema` `{ id, fromSegment, toSegment, seamAllowanceMm, pairsWith?: { pieceId, edgeId, intendedEaseMm? } }`.
  - `notchSchema` `{ id, edgeId, atMm, pairsWith? }`, where `atMm` is the distance along the stitch line from the edge start.
  - `dartSchema` `{ id, edgeId, apex, legs: [Point, Point] }`.
  - `labelSchema` `{ id, kind: name|size|cut|scale-square, text {ar,en}, at, rotationDeg, sizeMm? }`.
  - `pieceSchema`, with `bbox` renamed to `{ widthMm, heightMm }`.
  - `sewingStepSchema`, `validationCheckSchema`, `validationReportSchema` and `patternResultSchema`.
  - Inferred types and a JSDoc on each schema.
- `packages/schemas/src/engine-options.ts` (new):
  - `easeProfileSchema` (`fitted|regular|loose`; moved here if it is not yet in `measurements.ts`).
  - `edgeKindSchema` (`side|neckline|armhole|hem|other`).
  - `engineOptionsSchema` `{ easeProfile, seamAllowance: { defaultsMm: Record<EdgeKind, number>, perEdgeMm: Record<"pieceId/edgeId", number> }, fabricWidthMm, sizeLabel }`.
  - `DEFAULT_SEAM_ALLOWANCE_MM` = side 15, neckline 10, armhole 10, hem 30, other 15.
- `packages/schemas/src/index.ts`: export both new files.
- `packages/schemas/scripts/write-json-schema.ts` and the root script `schemas:json`: write `packages/schemas/json/pattern-result.schema.json` with sorted keys, so the file is stable.
- `packages/test-fixtures/src/pattern.ts` (new): a rectangle `PatternResult`, 200 × 300 mm, made of 4 line segments, with 1 edge pair, a grain line, labels and a pass report. Export it from `index.ts`.
- `docs/SRS.md` §6.3: update the field names (renames below) and add `code` and `FR-MEAS-01`.

## Data, API, migrations

None. No database or HTTP change; patterns are stored in M3.

## Tests

- `pattern.test.ts`:
  - The fixture parses.
  - Parsing fails for: no grain line, an open stitch path (last end 1 mm off), a gap between segments, an unknown check id `FR-VAL-99`, a negative seam allowance, and an `onFold` piece with quantity 0.
- `engine-options.test.ts`:
  - The defaults equal FR-PAT-03.
  - A per-edge override parses.
  - A negative fabric width fails.
- `json-schema.test.ts`: regenerates the JSON Schema in memory and compares it with the checked-in file, so it fails when the file is stale.
- Manual test cases: none. This is a contract with no UI.

## Decisions

The build writes them as `docs/decisions/121-pattern-contract.md`.

1. **Segment shape.** Every segment stores `from` and `to`, even though `from` repeats the previous end. A consumer can read one segment alone. Continuity is checked to 0.01 mm.
2. **Unit renames** against SRS §6.3, made in the same PR as the SRS update:

   | SRS §6.3 field              | New field                       |
   | --------------------------- | ------------------------------- |
   | `seamAllowance`             | `seamAllowanceMm`               |
   | `bbox.w`, `bbox.h`          | `bbox.widthMm`, `bbox.heightMm` |
   | `Edge.from`, `Edge.to`      | `fromSegment`, `toSegment`      |
   | check `measured`/`expected` | `measuredMm` / `expectedMm`     |

3. **Check ids.** `ValidationCheck.id` is one of `FR-VAL-01`…`FR-VAL-08` or `FR-MEAS-01` (input measurements rejected). Each check also gets an optional stable `code` (e.g. `MEAS_WAIST_ABOVE_BUST`), so #125 can report measurement errors without a new id per code.
4. **JSON Schema.** Generated with Zod 4's native `z.toJSONSchema`; no extra dependency.

## Docs

- SRS §6.3.
- `docs/engine/README.md` Contract section: link to `pattern.ts`.
- Handbook glossary: "PatternResult", if missing.
- Learning-log row.

## Risks

- **Zod refinements may not appear in the JSON Schema.** If they don't, document that continuity and closure are checked only in TypeScript.
- **#124 and #125 build on these types.** The names above are fixed by this plan, so they can be planned now.

## Size

S, as labelled. build:sonnet (unchanged).
