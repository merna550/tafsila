# Plan · #134 · Set-in sleeve block fitted to the armhole, all lengths

Approved plan, copied from the [plan comment on #134](https://github.com/merna550/tafsila/issues/134#issuecomment-6239584997) (comment-only plan per Merna; the build PR adds this file). Changes made while building are recorded in [decision 134](../decisions/134-set-in-sleeve.md).

## Approach

Draft a pure set-in sleeve block from the resolved measurements and the bodice armhole values written by #128. Reuse the existing bisection solver to find cap height, generate front/back cap curves and underarm seams, add the three sewing notches, and register `sleeve/set-in` after the bodice block. `sleeve.type: none` adds no sleeve piece and leaves the armhole available for finishing.

## Files to create/change

- `packages/engine/src/constants/sleeve-block.ts`: named ease and length-ratio constants with sources.
- `packages/engine/src/blocks/sleeve/`: input derivation, key points, cap/underarm paths, piece builder, module, unit/property/snapshot tests.
- `packages/engine/src/sleeve/sleeve-cap.ts`: only extend the solver API if the block needs front/back half lengths; retain existing behavior/tests.
- `packages/engine/src/pipeline/default-registry.ts` and exports: register the module in stable order.
- `packages/test-fixtures/src/reference-drafts*` and design fixtures: assert S/M/XXL reference points and seed sleeve designs.
- `docs/plans/134-set-in-sleeve.md`, `docs/decisions/134-set-in-sleeve.md`, `docs/engine/README.md`, `docs/test-cases/engine/134-set-in-sleeve.md`, learning log, snapshots, and engine version.

No database, migration, HTTP/OpenAPI, or new public schema change is expected.

## Test plan

- Unit: exact key points for S/M/XXL; cap solver convergence/error codes; every length ratio; front/back notch identity and underarm edge pairing.
- Property: across `SIZE_MATRIX` and custom measurements, cap ease 10–40 mm, underarm halves within 2 mm, closed/non-self-intersecting geometry, deterministic output and no input mutation.
- Integration/snapshot: set-in sleeves for all five lengths and chart sizes; `none` produces no sleeve; default-registry output stays schema-valid and all applicable FR-VAL rules run.
- Manual drafts: `TC-SLEEVE-134-01` short S, `-02` long M, `-03` three-quarter XXL, `-04` notch matching, `-05` no-sleeve armhole finish; retain `needs:sew-test` until three logged toiles.

## Risks and handling

- Cap solver may have no feasible root for extreme measurements: bound named search intervals and return a stable bilingual drafting failure.
- Cap curve length is sensitive to control points: lock reference points and property-test the final curved length, not chord lengths.

## Estimate, labels, and decisions

- Size `M`, `build:opus`; `needs-interactive`: no.
- Decisions for the build ADR: one sleeve piece with front/back cap edges; the solver targets the midpoint of the allowed cap-ease range while validation enforces the full range; length ratios come from the drafting method and are constants.
