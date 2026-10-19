# Plan: #143 closures (zip, buttons, none)

Copy of the approved plan comment on #143 (comment 6239588211), plus the later request from #142 (comment 6262408459): add the open wrist cuff's button and buttonhole marks (decision 142, 5).

## Approach

Apply closure behavior after bodice/skirt shaping and before finishing. Zip positions convert the selected fold to a seam, add the category-specific zip stop, paired notches and allowance override. Centre-front buttons add an extension/facing and evenly spaced button/buttonhole marks. `none` keeps folds but adds an FR-VAL-08 warning when the neck/waist opening cannot pass the head/hips. Allowed category/type/position combinations live as data with bilingual validation.

## Files to create/change

- `packages/engine/src/constants/closure.ts`: zip lengths, allowance, button/extension/spacing and opening ratios.
- `packages/engine/src/modules/closure/{compatibility,zip,buttons,none,module}.ts` plus tests/snapshots.
- Consume the typed `Piece.marks` contract/renderer owned by #137 for buttons/buttonholes; add an explicit build dependency on #137 rather than creating duplicate mark shapes.
- Registry, module validation/messages, fixture designs.
- `docs/plans/143-closures.md`, decision, engine README/test-case/learning-log, snapshots and engine version.

No database, migration or HTTP/OpenAPI change is expected. PatternResult changes only through the shared #137 marks contract.

## Test plan

- Unit: every valid closure position, fold-to-seam/cut quantity switch, allowance override, extension/facing, zip stop and evenly spaced symmetric marks; every invalid combination gets stable bilingual output.
- Property: zip notches on paired edges align within 2 mm; button marks remain inside the extension/piece; no duplicate or dangling edge refs across chart sizes.
- Integration/snapshot: CB/side/CF zip, CF buttons and none for applicable garment categories.
- Manual drafts: `TC-CLOSE-143-01` CB zip, `-02` side zip, `-03` CF zip, `-04` CF buttons, `-05` no-closure head warning, `-06` no-closure hip warning; retain `needs:sew-test` for CB zip and CF buttons in three sizes.

## Risks and handling

- Closure modules touch centre edges created by several modules: resolve targets by stable piece/edge ids and fail with refs instead of assuming path indexes.
- Shared marks can cause parallel-branch conflicts: build #137 first, then rebase #143.

## Estimate, labels, and decisions

- Size `M`, `build:opus`; `needs-interactive`: no.
- ADR decisions: closure is a late feature transform; category combination matrix is declarative; #137 owns generic marks; no-closure fit is a warning, not silent geometry repair.
- Comment-only plan per Merna; implementation adds plan/decision files.

## Deviations

- **No dependency on a separate marks contract.** #137 had already merged the typed `Piece.marks`; this PR adds the `button` (point) and `buttonhole` (line) kinds to it.
- **Matrix wider than the issue text.** Buttons work at the centre back as well as the centre front (the mandarin collar of #141 already allowed CB buttons), and a skirt may close at the centre front (its waistband already opened there, #140). Buttons are refused at the side, down a centre line a slit opens, and on a skirt band split into panels.
- **Facing.** The button facing is traced from the extended shell piece (60 mm past the centre front, extension included) as its own piece plus an interfacing; under a collarless neck the neck facing also gets the extension (decision 143, 4).
- **Hip check scope.** The no-closure hip check covers dresses and skirts the waistband module does not finish; the waistband's own `WAIST_HIP_PASS` rule (#140) already covers skirts with a waist finish, and the neck rule (#139) covers the head. The `-05` head case reuses that rule.
- **Schema additions.** `BodyLine.overlapMm` (a button extension is not circumference), notion kinds `zip` and `button`, mark kinds `button` and `buttonhole`; `pnpm schemas:json` regenerated.
- **Cuff buttons** from #142 are included (`cuffButtonMarks`).
- **Test-case ids** are `TC-ENG-143-xx`, like the other engine files (the plan said `TC-CLOSE-143-xx`).
- **Pre-existing flaky property** found: the contour waistband throws on an extreme waist-hip body (#218, from #140); not changed here.
