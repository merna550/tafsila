# ADR-133 · 2026-10-17 · Fit validation metadata and report granularity

**Context:** Issue #133 implements FR-VAL-01, FR-VAL-02, FR-VAL-03, FR-VAL-04 and FR-VAL-07. Plan: `docs/plans/133-fit-validation.md`.

**Decision:**

1. **Rules may emit several report rows.** `ValidationRule.runMany` lets one registered rule report once per seam pair, body line, notch pair or dart while existing one-row rules keep `run`. The pipeline preserves deterministic registry and geometry order.
2. **Body lines are explicit geometry metadata.** Each piece has `bodyLines`: an edge measured with darts closed, or a horizontal cross-section measured against the stitch path. A shared multiplier treats a fold half as two and otherwise uses cut quantity. A line id separates bodice waist from skirt waist in a dress.
3. **Special fit relationships are declared, not inferred from ids.** A sleeve declares its cap edge and armhole refs; paired edges may declare reversed sewing direction; darts may declare an axis, direction and minimum bust-point setback.
4. **Bad refs fail as data.** Missing edges, lines or partners produce stable bilingual checks rather than throws. Validators never mutate or repair geometry.
5. **All SRS tolerances live together.** Seam/notch 2 mm, sleeve-cap ease 10–40 mm, circumference 5 mm and dart-leg 1 mm are named constants in `constants/validation.ts`.

**Consequence:** The pattern contract and engine output version advance. Sleeve-cap and notch rules can be validated with fixtures before their generating blocks exist, then apply automatically when those declarations are produced.
