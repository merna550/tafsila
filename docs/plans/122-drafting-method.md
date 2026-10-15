# Plan #122: choose the block drafting method and write reference drafts

Plan comment: <https://github.com/merna550/tafsila/issues/122#issuecomment-6199249591>.

Plan wave M2 (2026-10-15), approved by Merna. Type `spike`, size S. Docs and one fixture only; no engine code. Critical path: #122 -> #126 (ease) -> #128 (bodice) -> #129 (skirt) -> #134 (sleeve) -> #144.

Merna's decisions (recorded in [ADR-122a](../decisions/122a-drafting-system.md)):

1. **Drafting system:** Winifred Aldrich, _Metric Pattern Cutting for Women's Wear_, 6th ed. (2015, Wiley-Blackwell), metric made-to-measure blocks. FreeSewing is only a cited reference for curves (ADR-122).
2. **Reference chart:** `egyptianSizeChart` from #158 (PR #159), sizes S, M and XXL.
3. **Missing body lengths** are derived with a cited ratio. No schema or form change.

## Approach

1. **Decision file** `docs/decisions/122a-drafting-system.md` (letter `a`: ADR-122 is already `122-m2-engine-scope.md`). Records the system and edition, the Egyptian chart, and the derive-don't-add rule. `needs:decision` is removed and Merna's choice is posted as an issue comment (AC 1).
2. **`docs/engine/drafting-method.md`** covers three blocks: close-fitting bodice (front and back, bust and waist darts), straight skirt (front and back, waist darts) and the one-piece set-in sleeve. For each:
   - Numbered construction steps, each a formula on our `Measurements` fields (mm), paraphrased with chapter and page, never copied text.
   - The coordinate frame: x right, y down, as in `packages/engine/src/geometry/point.ts`.
   - A named key point per step (`bodice.back.nape`, `bodice.front.bustPoint`, `skirt.front.hipSide`, `sleeve.capTop`, ...). Block issues assert against these names.
3. **Measurement mapping table:** the fields we have, the lengths Aldrich uses that we do not have (armscye depth, back width, chest width, shoulder length, dart sizes) derived by ratios, and the `bustHeight` conflict (SRS: HPS to bust point; engine README: shoulder point; README fixed to the SRS).
4. **Ease section** lists the ease already inside the blocks (bust, waist, hip, sleeve) so #126's tables add only style ease.
5. **`packages/test-fixtures`:**
   - `reference-drafts-calc.ts`: the one calculation, with every constant named (not engine code).
   - `gen-reference-drafts.ts`: prints the fixture (`ts`) and the document tables (`md`) from that calculation.
   - `reference-drafts.ts`: generated `ReferenceDraft` (name -> `Point`) per size (S, M, XXL) and block, with `Point` from `@tafsila/schemas`.
   - `reference-drafts.test.ts`: every name present, values finite, fixture equals the calculation, sanity checks (bust quarter plus ease, hip depth, bust point).
6. **`docs/engine/README.md`:** "Drafting methods and sources" intro and rows for bodice, skirt, sleeve; `bustHeight` row fixed.

## Files

- New: `docs/decisions/122a-drafting-system.md`, `docs/engine/drafting-method.md`, `docs/plans/122-drafting-method.md`, `docs/test-cases/engine/122-drafting-method.md`, `packages/test-fixtures/src/reference-drafts-calc.ts`, `reference-drafts-sizes.ts`, `gen-reference-drafts.ts`, `reference-drafts.ts`, `reference-drafts.test.ts`.
- Edit: `packages/test-fixtures/src/index.ts`, `docs/engine/README.md`, `docs/handbook/glossary.md`, `docs/handbook/learning-log.md`, `CLAUDE.md` (open decision closed), `docs/test-cases/index.md` (generated).

## Risks

- Aldrich's page numbers differ between editions: one edition is named in the decision file.
- A calculation error would propagate into three block issues: the doc tables and the fixture come from one calculation, and size M is recomputed independently (separate script, exact fractions).
- The book was not available to the author: constants and page numbers need Merna's check (checklist at the end of `drafting-method.md`).

## Verification

- `pnpm --filter @tafsila/test-fixtures test`, `pnpm quality`, `pnpm docs:check`.
- Merna reviews `drafting-method.md` (AC 2). AC 1 is the issue comment, ACs 3 and 4 are ticked from the PR.
- PR body: `Closes #122`.
