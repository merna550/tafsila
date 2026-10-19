# Plan: #238 specOptions, defaultSpec and normalizeSpec for the design picker

Copy of the approved plan comment (issue #238).

Plan wave M3, 2026-10-19. No dependencies (M2 modules merged). [ADR-236](../decisions/236-m3-scope.md) item 8: one rule source.

### Approach

The refusal rules already exist as small predicates in the modules: `checkCategory` / `CATEGORY_PARTS` / `ONE_PIECE_SKIRT_TYPES` (`pipeline/category-rules.ts`), `closureIssue` + `CLOSURE_MATRIX` (`modules/closure/compatibility.ts`), `collarCombinationIssue` (`modules/collar/combinations.ts`), `sleeveCombinationIssue` + `SLEEVE_COMBINATIONS`, `pocketAllowed` (`modules/pocket/compatibility.ts`) and the slit rule (`SLIT_SKIRT_TYPES`). Today the only list of them is `REFUSALS` in `test-utils/arb-design-spec.ts`.

1. **Move that list into the engine** as `src/spec-rules/refusals.ts`: `specRefusals(spec): RefusalCode[]` built from the same predicates (imported, never copied). `test-utils/arb-design-spec.ts` then imports it, so the test filter and the picker can never disagree.
2. **`specOptions(spec)`** (`src/spec-rules/spec-options.ts`): for each feature path in a fixed list (`category`, `bodice.shaping`, `bodice.fit`, `bodice.waistSeam`, `neckline.front`, `neckline.back`, `neckline.collar`, `sleeve.type`, `sleeve.length`, `sleeve.cuff`, `skirt.type`, `skirt.length`, `skirt.slit`, `waistband`, `closure.type`, `closure.position`, `pockets` (each style), `belt`, `lining`), the candidate values come from the `designSpecSchema` enums (read from the schema's options, so a new enum value appears automatically). Each candidate is tried by setting it on a copy of the spec and running `specRefusals`; a value is `allowed` or `refused` with the first refusal code and its `{ ar, en }` from `INPUT_ERROR_MESSAGES`. Paths that do not apply to the category (`skirt.*` on a blouse) are returned as `applies: false`. Result type `SpecOptions = Record<FeaturePath, { applies: boolean; values: { value; allowed; reason? }[] }>` exported from `@tafsila/schemas` types or the engine (engine; the UI only reads it).
3. **`defaultSpec(category)`**: one valid starting spec per category in `src/spec-rules/default-spec.ts` (simple choices: darted bodice, round neck, short set-in sleeve, straight knee skirt, centre-back zip for the dress; straight band skirt; darted blouse). A test asserts each equals `normalizeSpec` of itself (already valid).
4. **`normalizeSpec(spec)`**: walks the same path list in order (parents first: category, then bodice, skirt, neckline, collar, sleeve, closure, pockets); for each path whose current value is refused, sets the first allowed value (or removes an optional part when nothing is allowed, e.g. a pocket style). Returns `{ spec, changed: FeaturePath[] }`. Parts that do not apply to the category are dropped (matching `CATEGORY_PARTS` "ignored", so no `SPEC_PART_IGNORED` warning appears in the preview).
5. Exports from `src/index.ts`; README section "Picker rules".

### Files

Create: `packages/engine/src/spec-rules/{index,feature-paths,refusals,spec-options,default-spec,normalize-spec}.ts` with `*.test.ts` and `normalize-spec.property.test.ts`.
Change: `packages/engine/src/test-utils/arb-design-spec.ts` (import `specRefusals`), `packages/engine/src/index.ts`, `packages/engine/src/pipeline/input-errors.ts` (only if a code lacks a message), `docs/engine/README.md`.

### Data / API

None. No `ENGINE_VERSION` bump (geometry unchanged).

### Tests

- Unit: for a dress with `waistSeam: false`, `skirt.type` lists `gathered` as refused with `DRESS_ONE_PIECE_SKIRT_UNSUPPORTED` and Arabic text; a shirt collar on a V neck is refused with `COLLAR_NECKLINE_UNSUPPORTED`; on a blouse `skirt.*` has `applies: false`.
- Unit: `normalizeSpec` on a one-piece dress with a gathered skirt changes `skirt.type` to `straight` and reports `["skirt.type"]`; on an already valid spec returns `changed: []` and a deep-equal spec.
- Every refused value in `specOptions(defaultSpec(c))` for all 3 categories has a code with non-empty `ar` and `en`.
- `defaultSpec(c)` generates on sizes S, M and XXL with `validation.status !== "fail"`.
- **Property** (fast-check, 60 runs, like #147): a raw schema-valid spec → `normalizeSpec` → `specRefusals` is empty, and `generatePattern` on S and XXL returns no input-error refusal code. Cases in `hitsKnownBug` (#229-#232) are skipped with the issue number, as in #147.
- Property: every value `specOptions` marks `allowed`, when set, keeps `specRefusals` empty (no false "allowed").
- No-duplication check: the test greps that `refusals.ts` imports each predicate (or a simple review item; no copy of `CLOSURE_MATRIX`).

Manual test cases: none (no UI); listed for #244/#246.

### Decisions (build writes `docs/decisions/238-picker-rules.md`)

1. The refusal list moves from test utilities into `src/spec-rules/refusals.ts`; tests and picker share it.
2. Candidate values are read from the Zod enums, not a second list.
3. `normalizeSpec` resolves parents before children and picks the first allowed value; optional parts with no allowed value are removed.
4. Parts ignored by the category are dropped by `normalizeSpec`.
5. Body-dependent refusals (pocket "no room", neck depth clamps, closure zip too long) are **not** in `specOptions`: they depend on measurements and stay as report checks.

### Risks

- A module refusal that is not one of the predicates (inside a module's `draft`) would be missed: the property test against `generatePattern` catches it; add it to `refusals.ts` if found.
- Order of normalisation can change user choices more than needed: the changed list lets the UI tell the user; tests pin the order.

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no.

---

## Deviations

- The feature list is walked as category, bodice, skirt, neckline, sleeve, closure, pockets, belt, lining (skirt before neckline), and `normalizeSpec` fixes each refusal through a per-code list of responsible features (`FIXES`) instead of walking every path; the category is never changed. Result is the same for the plan's examples.
- `FeatureOptions` has no `current` field; the UI already holds the spec.
- `isUsed` in `pipeline/category-rules.ts` is exported (reused, not copied).
- The slit refusal uses the warning code `SLIT_NOT_DRAFTED` (its message comes from the validation messages), so `RefusalCode` is `InputErrorCode | "SLIT_NOT_DRAFTED"`.
- `arbRawSpec()` is exported from `test-utils/arb-design-spec.ts` for the property tests.
