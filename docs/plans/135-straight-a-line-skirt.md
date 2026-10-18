# Plan #135: straight and A-line skirts, lengths and slit

Approved plan comment on issue #135 (plan wave M2), saved here by the build PR. Depends on #129 and #130, both merged. Physical QA: `needs:sew-test` stays until an A-line midi toile is sewn in 3 sizes.

## Approach

Keep the straight skirt block as the base, then apply one deterministic style module for `straight` or `a-line`, resolved length, and optional slit. A-line closes the waist dart and pivots that intake into hem flare so waist/hip fit is preserved. Slits alter the selected seam with an extension and a top notch. Long narrow straight skirts contribute an FR-VAL-08 walking-ease warning.

## Files

- `packages/engine/src/constants/skirt-style.ts`: stride, slit extension and hip clearance.
- `packages/engine/src/modules/skirt/{a-line,slit,rules,shape-module,slit-module}.ts` and tests; pure piece replacement through `withPiece`.
- `packages/engine/src/pipeline/default-registry.ts`: register after `block-skirt`.
- Module-specific FR-VAL-08 rules and bilingual messages.
- `packages/schemas`: `polyline` body line (JSON Schema regenerated), measured by `pieces/body-lines.ts`.
- `packages/test-fixtures/src/designs.ts`, SVG snapshots, decision, engine README/test-case/learning-log, and engine version.

No database, migration, HTTP/OpenAPI change.

## Tests

- Unit: named lengths and `lengthMm` override; each slit position; slit top below hip; seam extension and notch; A-line pivot preserves waist and hip.
- Property: side seams within 2 mm, hip circumference equals body plus ease within 5 mm, waist unchanged, A-line hem gain equals the declared gain, no crossings, only a too-long slit fails; walking-ease warning exactly when it should.
- Snapshot: every length for straight and A-line (size M), and back slit, side slit and A-line midi for every chart size.
- Manual: `docs/test-cases/engine/135-straight-a-line-skirt.md`.

## Build notes

- Built as planned with three changes, all in decision 135: the pivot sits on the hip line (so the hip keeps its size and a new `polyline` body line measures it); a front or back slit turns that fold into a centre seam instead of being rejected; the flare amount is the closed dart (no separate flare constant).
