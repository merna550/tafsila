# ADR-238 · 2026-10-19 · Picker rules: one refusal list, specOptions, defaultSpec, normalizeSpec

**Context:** Issue #238 (FR-DES-05, ADR-236 item 8: one rule source). Plan: [`docs/plans/238-picker-rules.md`](../plans/238-picker-rules.md). Cheap to reverse: engine-internal helpers, no geometry change (no `ENGINE_VERSION` bump).
**Decision:**

1. **One refusal list.** The list of part combinations the engine refuses moved from `test-utils/arb-design-spec.ts` to `packages/engine/src/spec-rules/refusals.ts` (`specRefusals`). It calls the modules' own predicates; the test arbitrary imports it, so tests and the picker cannot disagree.
2. **Candidate values come from the Zod enums** (`designSpecSchema.shape...options`), so a new enum value shows up in the picker automatically.
3. **`normalizeSpec` fixes the add-on, not the garment.** Each refusal code maps to the features that can resolve it (`FIXES`); the first value that removes the refusal (preferably leaving none) is used. The category and the main shapes (bodice, skirt type except for a one-piece dress) are never changed; an unsupported pocket is removed.
4. **Parts ignored by the category are dropped** by `normalizeSpec` (no `SPEC_PART_IGNORED` warning in the preview); missing required parts are added from `defaultSpec`.
5. **Body-dependent refusals** (pocket room, neckline depth clamps, zip length) are not in `specOptions`; they stay report checks.
6. `specOptions` judges one feature at a time on the given design, so call it on a normalised design.
