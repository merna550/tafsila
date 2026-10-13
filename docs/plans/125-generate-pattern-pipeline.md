# Plan #125: generatePattern pipeline, DraftContext and feature module registry

Plan comment: <https://github.com/merna550/tafsila/issues/125#issuecomment-6155682015>.

Plan wave M2 (2026-10-13). Depends on #121 (`PatternResult`, `EngineOptions`, `ValidationCheck` with `code`).

## Approach

`generatePattern` checks its inputs first, then runs seven steps in order: `resolve → blocks → modules → finishing → layout → validate → sewingOrder`.

- Each step is a pure function of type `(ctx: DraftContext) => DraftContext` over a frozen context.
- Steps without real content yet are identity functions. Later issues (#126 ease, #128/#129 blocks, #130/#131 finishing, #132 validation, #146 sewing order) fill them in without changing the pipeline shape.
- Modules and rules come from a registry. Its order is fixed by the declared `order` and then `id`, so the order the modules were registered in does not matter.
- Input problems become a `fail` result; they are never thrown. A `DraftingError` means a programming error.

## Files

All under `packages/engine/src/` unless noted.

- `pipeline/draft-context.ts`: the `DraftContext` type.
  - Fields: `spec`, `measurements`, `options`, `resolved` (named numbers in mm; empty until #126), `pieces: readonly PieceDraft[]` and `checks: readonly ValidationCheck[]`.
  - `PieceDraft` is a `Piece` whose cut path, labels and bbox may still be missing before finishing.
  - Helpers `createContext`, `withPiece` and `withCheck` return new frozen contexts.
- `pipeline/feature-module.ts`: the `FeatureModule` interface `{ id, order, appliesTo(spec), draft(ctx), validations? }` and the `ValidationRule` interface `{ id: CheckId, appliesTo(ctx), run(ctx): ValidationCheck }`.
- `pipeline/registry.ts`: `createRegistry(modules)`.
  - Sorts by `order`, then `id`.
  - Throws `DraftingError("PIPELINE_DUPLICATE_MODULE")` when two modules share an id.
  - Exposes `modulesFor(spec)` and `rulesFor(ctx)`.
- `pipeline/steps.ts`: the seven step functions.
  - `modules` runs each module that applies, in registry order.
  - `validate` runs the registered rules and builds the report: status is the worst of the checks, `pass` when there are none.
  - The other five are identity stubs, each with a JSDoc naming the issue that fills it.
- `pipeline/category-rules.ts`: data saying which blocks each category needs.

  | Category | Blocks         |
  | -------- | -------------- |
  | dress    | bodice + skirt |
  | skirt    | skirt          |
  | blouse   | bodice         |

  `assertCategory(spec)` throws `DraftingError("PIPELINE_UNSUPPORTED_COMBINATION")` when the parts of the spec are missing or out of place, e.g. a skirt with a `bodice` part.

- `pipeline/input-check.ts`: parses the input with `designSpecSchema`, `measurementsSchema` and `engineOptionsSchema`, then runs `validateMeasurements`.
  - Any problem becomes a `fail` check: id `FR-MEAS-01`, its `code` (e.g. `MEAS_*`, or `SPEC_INVALID` for a schema error), and the bilingual message.
  - Warnings stay `warn` checks and do not stop drafting.
- `pipeline/input-hash.ts`:
  - `canonicalJson(value)`: sorted keys, and `-0` becomes `0`. It throws on a non-finite number.
  - `inputHash(spec, measurements, options)`: FNV-1a 64-bit (via BigInt) over `canonicalJson({ spec, measurements, options, engineVersion })`, written as `fnv1a64:<16 hex>`.
- `pipeline/generate-pattern.ts`: `generatePattern(spec, measurements, options = defaults, registry = defaultRegistry)`.
  - When the input check fails, it returns `{ pieces: [], sewingOrder: [], validation: fail, meta }`.
  - Otherwise it runs the steps and maps the context to a `PatternResult`.
- `pipeline/index.ts`; `src/index.ts` exports `generatePattern`, the types and `createRegistry`.
- `pipeline/test-support/rectangle-module.ts` (test only, not in the default registry): adds a 200 × 300 piece and an `FR-VAL-06` rule. The `PatternResult` it produces matches the #121 fixture.
- `pipeline/default-registry.ts`: empty for now. Later modules are added here, one line each.

## Data, API, migrations

None. The API starts calling `generatePattern` in M3.

## Tests

- **The rectangle registry:**
  - The result parses with `patternResultSchema`.
  - It has 1 piece and the `FR-VAL-06` check passes.
  - `meta.category`, `meta.sizeLabel` and `meta.createdFrom` are set.
- **Determinism:**
  - Running twice gives a deep-equal result and the same hash.
  - Property test (fast-check): shuffling the key order of spec, measurements and options does not change the hash.
  - Changing one measurement by 1 mm changes the hash.
- **Invalid input:**
  - Waist above bust gives status `fail`, a `FR-MEAS-01` check with the `MEAS_*` code from `validateMeasurements`, and no throw.
  - A malformed spec gives `SPEC_INVALID`.
- **Registry order:** registering the modules [b(order 2), a(order 1), c(order 1)] in any permutation runs them as a, c, b. A duplicate id throws.
- **Category rules:** a skirt with a bodice throws `PIPELINE_UNSUPPORTED_COMBINATION`; a dress without a skirt part throws too.
- **Purity:** the inputs are deep-frozen, and the result object is frozen.
- **Performance smoke test:** the rectangle pipeline finishes in under 5 ms. This is a guard; FR-PAT-04's 500 ms is the real target, measured in #147.
- Manual test cases: none (no UI).

## Decisions

The build writes them as `docs/decisions/125-pipeline.md`.

1. **Context shape.** `DraftContext` is one frozen value. A module adds pieces and checks only through the helpers, and never changes another module's piece in place; a change returns a new piece with the same id.
2. **Input hash.** FNV-1a 64-bit over canonical JSON. It is synchronous, has no dependency, and gives the same result in the browser and in Node. Collisions don't matter here: the hash only detects "same input". SHA-256 can replace it later by bumping the prefix.
3. **Invalid input.** It returns a `fail` result with no pieces, keyed `FR-MEAS-01` + `code`, as #121 decided. Only programming errors throw.
4. **Steps.** The pipeline steps are fixed now; empty steps are identity functions that name their owning issue.

## Docs

- `docs/engine/README.md` Pipeline section: describe the real files, the context, the registry order and the input check.
- Link the handbook pattern `functional-core-plugin-pipeline.md` and update its example to the real names.
- Learning-log row.

## Risks

- **#126, #128 and #130 will need fields in the context that aren't known yet.** `resolved` is an open record of numbers in mm, and `PieceDraft` allows the parts finishing adds later. Adding a field is allowed; renaming one needs a plan change.
- **Overlap with #124.** No geometry is used here except the rectangle in the test module, which is built with `lineSeg` from #124 when it is merged, or with plain segments otherwise.

## Size

M, as labelled. build:sonnet (unchanged).
