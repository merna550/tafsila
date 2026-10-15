# ADR-126 · 2026-10-15 · Ease tables and the resolve step

**Context:** Issue #126 (FR-MEAS-06, FR-PAT-01, FR-VAL-03, FR-VAL-08). Block drafters need finished widths, not raw body circumferences. The Aldrich blocks of `docs/engine/drafting-method.md` already contain some ease, so adding the SRS ease on top would count it twice.
**Decision:**

1. **Tables store total ease** (matches SRS §6.2 and FR-VAL-03). `resolveDraftInputs` subtracts the blocks' built-in ease (`BLOCK_BUILT_IN_EASE_MM`) and returns the remainder as `styleEaseMm`. No ease is applied twice.
2. **Numbers** (mm, whole circumference, woven). The regular column for bust, waist and hip is SRS §6.2. The fitted and loose columns and the modifiers are **proposals for Merna to approve**; changing them touches one file and the README table.

   | Body line  | fitted | regular | loose |
   | ---------- | ------ | ------- | ----- |
   | bust       | 60     | 80      | 120   |
   | waist      | 20     | 40      | 70    |
   | hip        | 30     | 50      | 80    |
   | upperArm   | 40     | 50      | 80    |
   | acrossBack | 0      | 0       | 20    |

3. **`bodice.fit` is an additive modifier** on bust, waist and hip: fitted -10, semi-fitted 0, loose +30. The sum is floored at 0. No bodice means 0.
4. **Skirt lengths** use named offsets and shares: mini K - 180, knee K, midi K + 0.40 (F - K), ankle K + 0.85 (F - K), floor F - 20 (K = `waistToKnee`, F = `waistToFloor`). An explicit `lengthMm` wins. Errors: `SKIRT_LENGTH_INVALID_BODY` (F - K < 150), `SKIRT_LENGTH_OUT_OF_BODY` (`lengthMm` < 100 or > F).
5. **File:** `packages/engine/src/constants/ease.ts` (the SRS said `src/ease.ts`; constants live in `src/constants/`). SRS §6.2 updated.

**Consequences:** The regular bodice at size M equals the #122 reference points. The regular skirt is wider than the #122 reference skirt (drafted with built-in ease only): hip quarter 272.5 vs 270 (+2.5 mm), waist quarter 205 vs 200 (+5 mm). #131 (skirt block) must compare against the reference after setting the style ease to 0 (`styleEaseMm.skirtHip` and `skirtWaist`), or Merna may prefer to regenerate the reference with the SRS values. Not done here.
