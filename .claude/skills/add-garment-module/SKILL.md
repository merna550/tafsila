---
name: add-garment-module
description: Add a garment feature to the pattern engine (DesignSpec enum → FeatureModule → validation rules → property and snapshot tests → seed design → sew-test flag). Use when an issue adds or changes pattern geometry, such as a new neckline, sleeve, skirt or closure.
---

# Add a garment feature module

Read `packages/engine/CLAUDE.md`, `docs/engine/README.md` and `docs/backend/tutorials/add-garment-module.md` first. Geometry work needs a `plan:opus` plan.

1. **Spec:** extend the `DesignSpec` enum in `packages/schemas` and the catalogue in SRS §6.1. Include the Arabic name and an option card image.
2. **Method:** write down the drafting method and its source in the plan and in the module's JSDoc. Add any new constants to `packages/engine/src/constants/` in mm.
3. **Module:** implement a pure `FeatureModule` (`id`, `appliesTo`, `draft`) that reuses blocks and `src/geometry/`. Register it in the module registry.
4. **Validation:** register the FR-VAL rules the feature needs (seam match, notches, cap ease, darts…) with bilingual messages.
5. **Tests:**
   - Unit tests for key points.
   - fast-check property tests for each FR-VAL rule across the size matrix in `@tafsila/test-fixtures`.
   - An SVG snapshot per size.
6. **Version:** bump `ENGINE_VERSION` if existing inputs now produce different geometry.
7. **Seed:** add a design that uses the feature to `packages/test-fixtures` and to the seed data.
8. **Test cases:** add `docs/test-cases/engine/<N>-<slug>.md`, then run `scripts/test-case-index.sh`. Add the `needs:sew-test` label and keep it until a toile is sewn in 3 sizes and logged.
9. **Docs:** add the module to the catalogue in `docs/engine/README.md`.
10. **Definition of Done:** complete every item in `docs/WORKFLOW.md` §5. Run `pnpm quality && pnpm test`.
