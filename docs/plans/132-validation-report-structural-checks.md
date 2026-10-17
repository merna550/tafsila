# Plan #132: validation report and structural checks (FR-VAL-05, -06, -08)

Plan comment: <https://github.com/merna550/tafsila/issues/132#issuecomment-6237390241>.

Plan wave M2, 2026-10-17. Depends on #124 and #125, both merged.

## Approach

The `validate` step already runs registered rules and builds the report (status = worst check). What is missing is the **core rules** that apply to every pattern, the **message catalogue**, and a place to register them. Each rule reports one check and never changes geometry.

## Files to create or change

All under `packages/engine/src/`, tests next to each.

- `validation/messages.ts`: the catalogue. A `VALIDATION_MESSAGES` map from stable code to `{ ar, en }` with a placeholder syntax (`{piece}`, `{edge}`, `{mm}`), and `formatMessage(code, params)`. Codes:

  | Code                       | Check     | Status when raised |
  | -------------------------- | --------- | ------------------ |
  | `STRUCT_OK`                | FR-VAL-05 | pass               |
  | `STRUCT_OPEN_PATH`         | FR-VAL-05 | fail               |
  | `STRUCT_SELF_INTERSECTION` | FR-VAL-05 | fail               |
  | `STRUCT_MISSING_SA`        | FR-VAL-05 | fail               |
  | `LABELS_OK`                | FR-VAL-06 | pass               |
  | `LABELS_NO_GRAIN`          | FR-VAL-06 | fail               |
  | `LABELS_NO_NAME`           | FR-VAL-06 | fail               |
  | `LABELS_NO_CUT_INFO`       | FR-VAL-06 | fail               |
  | `PLAUS_OK`                 | FR-VAL-08 | pass               |
  | `PLAUS_NEGATIVE_EASE`      | FR-VAL-08 | warn               |
  | `PLAUS_WIDER_THAN_FABRIC`  | FR-VAL-08 | warn               |

  Arabic is plain and short (`docs/design/copy.md`): for example "الحافة مفتوحة: القطعة {piece} لا تقفل على نفسها". A test fails if a code has no `ar` or no `en` text, or a placeholder is missing in either.

- `validation/rules/structural.ts`: three rules with id `FR-VAL-05`:
  - **open path:** `isClosed` on `stitchPath` and `cutPath` (tolerance `GEOMETRY_EPSILON_MM`); refs are `pieceId`;
  - **self-intersection:** `selfIntersections` on both paths; refs are `pieceId`, and the number of crossings is in the message;
  - **seam allowance present:** every edge that is not `kind: "fold"` has `seamAllowanceMm > 0`, and `cutPath` differs from `stitchPath` unless every edge is a fold; refs are `pieceId/edgeId`.
- `validation/rules/labels.ts`: `FR-VAL-06`: grain line has length > `GEOMETRY_EPSILON_MM`; `name.ar` and `name.en` are non-empty; `cut.quantity ≥ 1`. One rule per failure mode like above, refs are piece ids.
- `validation/rules/plausibility.ts`: `FR-VAL-08`:
  - **negative ease:** reads the total ease from `resolveDraftInputs` (`totalEaseMm` for bust, waist, hip, upper arm); any value below 0 is a `warn`, with the line name and the value in the message. (Woven only; the schema only has woven.)
  - **wider than fabric:** for each piece, the extent of `cutPath` perpendicular to its grain line, doubled when `cut.onFold`, compared with `options.fabricWidthMm`; `measuredMm` is the extent, `expectedMm` the fabric width, `refs` the piece id. Default fabric width stays 1400 (`DEFAULT_ENGINE_OPTIONS`); the issue says 1500, so the plan follows the code and the decision below fixes it.
- `validation/core-rules.ts`: `CORE_RULES`, the list of all of the above.
- `pipeline/registry.ts` (change): `createRegistry(modules, coreRules = [])`; `rulesFor(ctx)` returns the applicable core rules first, then the modules' rules, both in fixed order (rule id, then code). `pipeline/default-registry.ts` passes `CORE_RULES`.
- `pipeline/steps.ts`: no change to `validateStep`; `buildReport` already takes the worst status. The refs and measured values come from each rule.
- `packages/schemas/src/pattern.ts`: no change (`code`, `measuredMm`, `expectedMm`, `refs` already exist).
- `pipeline/test-support/rectangle-module.ts` (test): the rectangle module's own `FR-VAL-06` width rule stays for the module test; the registry for `generatePattern` tests uses core rules too.

## Data, API, migrations

None.

## Tests

- **Broken fixtures (unit):**
  - open path (last point 1 mm off) → `STRUCT_OPEN_PATH`, fail, refs the piece;
  - a bow-tie outline → `STRUCT_SELF_INTERSECTION`;
  - an edge with `seamAllowanceMm: 0` and not a fold → `STRUCT_MISSING_SA`, refs `piece/edge`;
  - no grain line (zero length), empty name, quantity 0 → the three `LABELS_*` codes;
  - a 1600 mm wide piece with `fabricWidthMm: 1400` → warn with `measuredMm: 1600`; the same piece on a fold, 900 mm half → 1800 → warn;
  - `easeProfile` that yields negative total ease (a test-only resolve stub) → `PLAUS_NEGATIVE_EASE`.
- **Valid fixture:** the rectangle pattern with finishing done passes all three checks and the report status is `pass`.
- **Overall status:** worst of the checks (warn + pass = warn; any fail = fail).
- **Catalogue:** every code has `ar` and `en`; placeholders match in both languages; Arabic contains Arabic letters.
- **Rules never change geometry:** inputs deep-frozen; the context returned by the validate step has the same `pieces` reference.
- **Determinism:** the order of checks in the report is fixed (id, then code, then ref).
- **Manual test cases:** none (no UI); the bilingual messages are listed in the PR for Merna's review.

## Decisions

The build writes them as `docs/decisions/132-validation-rules.md`.

1. **One rule per failure mode, the same `FR-VAL-xx` id on several checks.** `ValidationRule.run` returns a single check, and a report row per failure mode with its own `code` is what the M3 report UI (FR-VAL-09) wants to show. Passing modes are reported too, so the UI can show ✅.
2. **Core rules live in the registry** (`createRegistry(modules, coreRules)`), not inside the `validate` step, so a test can run a registry without them.
3. **Fabric width default stays 1400 mm**, the value already in `DEFAULT_ENGINE_OPTIONS`; the issue text says 1500. A one-constant change if Merna prefers 1500.
4. **Width across the grain** is the check, with the fold doubling: it is what has to fit on the fabric width. A piece longer than the fabric is not a problem (fabric is bought by length).
5. **Negative ease reads from `resolveDraftInputs`** (#126), so the check agrees with what the blocks used.

## Docs

- `docs/engine/README.md`: the validation table points at the code files (the issue asks for it); a short "How to add a rule" paragraph.
- Handbook: glossary "ValidationReport", "validation rule" if missing; learning-log row.

## Risks

- **FR-VAL-05 self-intersection on curved offsets** can report a false positive at a tight cusp. `selfIntersections` ignores joints; the test includes an armhole-like curve. If a block needs it, the cause is the block, not the rule.
- **Many checks with one id** might surprise the UI; the plan documents it in the README and SRS FR-VAL-09 note.
- **The `resolve` step is not wired yet**, so the plausibility rule calls `resolveDraftInputs` itself, as #129 does.

## Size

M, as labelled. build:sonnet (unchanged).
