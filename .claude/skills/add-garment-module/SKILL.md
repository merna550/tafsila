---
name: add-garment-module
description: Add a garment feature to the pattern engine (DesignSpec enum → FeatureModule → validation rules → property and snapshot tests → seed design → sew-test flag). Use when an issue adds or changes pattern geometry, such as a new neckline, sleeve, skirt or closure.
---

# Add a garment feature module

Read `packages/engine/CLAUDE.md`, `docs/engine/README.md` and `docs/backend/tutorials/add-garment-module.md` first. Geometry work needs a `plan:opus` plan. The engine rules are in `.claude/rules/engine/drafting.md`; the engine is pure TypeScript (no I/O, no React, no `fetch`).

0. **Generate the skeleton first:** `pnpm gen garment-module <name> <issue>` creates `packages/engine/src/modules/<name>.ts` (a `FeatureModule`), `<name>-validation.ts`, a test with a fast-check property and the test-case file (plus the shared `feature-module.ts` once). Replace the `NEXT(#issue)` placeholders; the M2 block-drafting contract (#122) will replace the placeholder `FeatureModule` type.
1. **Spec:** extend the `DesignSpec` enum in `packages/schemas` and the catalogue in SRS §6.1. Include the Arabic name and an option card image.
2. **Method:** write down the drafting method and its source in the plan and in the module's JSDoc. Add any new constants to `packages/engine/src/constants/` in mm.
3. **Module:** implement a pure `FeatureModule` (`id`, `appliesTo`, `draft`) that reuses blocks and `src/geometry/`. Register it in the module registry. The web app calls the engine only from `model/` or a Web Worker, never from `components/`.
4. **Validation:** register the FR-VAL rules the feature needs (seam match, notches, cap ease, darts…) with bilingual messages. If the API can reject the spec, add the codes to `ERROR_CATALOGUE` and `docs/errors.md` (ADR-030).
5. **Tests:**
   - Unit tests for key points.
   - fast-check property tests for each FR-VAL rule across the size matrix in `@tafsila/test-fixtures`.
   - An SVG snapshot per size.
6. **Version:** bump `ENGINE_VERSION` if existing inputs now produce different geometry.
7. **UI:** if the feature adds an option the user picks, add the option card with `packages/ui` components, strings in both `messages/ar.json` and `messages/en.json`, and follow the `add-page` skill.
8. **Seed:** add a design that uses the feature to `packages/test-fixtures` and to the seed data.
9. **Test cases:** add `docs/test-cases/engine/<N>-<slug>.md`, then run `scripts/test-case-index.sh`. Add the `needs:sew-test` label (no toile acceptance criterion in the issue) and open the follow-up issue `test(engine): sew-test toiles for #N`; name it in the PR body as `Sew-test follow-up: #M` (docs/WORKFLOW.md). The label stays on #N until the toiles are logged.
10. **Docs:** add the module to the catalogue in `docs/engine/README.md`.
11. **Definition of Done:** complete every item in `docs/WORKFLOW.md` §5. Run `pnpm quality && pnpm test`.
