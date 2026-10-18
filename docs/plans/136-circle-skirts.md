# Plan #136: half- and full-circle skirts

Plan comment on issue #136 (plan wave M2). Depends on #129 and #130, both merged. Physical QA: `needs:sew-test` stays until a toile is sewn in 3 sizes.

## Approach

A `FeatureModule` replaces the straight block pieces with circle-skirt quarters. The waist radius is derived from the assembled waist arc (waist + ease) and the actual cut multiplicity, measured on the drawn curve. Pieces are split deterministically when wider than `fabricWidthMm`, with paired seams and straight grain at CF / CB; the bias hem gets a sewing note.

## Files

- `packages/engine/src/constants/circle-skirt.ts`: sweeps, copies, waist tolerance, grain share, hem hang hours and note.
- `packages/engine/src/modules/circle-skirt/{draft,split,module}.ts` with tests and snapshots (flattened from `modules/skirt/circle/`, decision 136, 7).
- `packages/engine/src/geometry/arc.ts`: `arcToCubics`.
- `packages/engine/src/pieces/fabric-width.ts`: `widthAcrossGrainMm`, shared with the FR-VAL-08 rule.
- `packages/engine/src/blocks/skirt/edges.ts`: edges take segment runs; shared piece names.
- `packages/engine/src/pipeline/default-registry.ts`, `src/version.ts`, `@tafsila/test-fixtures` designs.

## Tests

- Unit: radii, key points, edge runs, grain line inside the piece; layout boundaries (fold at the exact width, split 1 mm narrower, warning on 300 mm).
- Property (size matrix × type × length × fabric 600–1800 mm): waist = waist + ease ± 5 mm; no self-intersection and no failing check; fits or FR-VAL-08 warns.
- Snapshot: half and full, every chart size, fabric 1500 and 900 mm.
- Manual: `docs/test-cases/engine/136-circle-skirts.md`.

## Build notes

- Built as planned. Two additions: the `lineLine` parallel tolerance (decision 136, 6) and the shallower module folder (decision 136, 7).
