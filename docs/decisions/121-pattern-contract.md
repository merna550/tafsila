# ADR-121 · 2026-10-13 · PatternResult contract

**Context:** Issue #121 (SRS §6.3). The engine output needs one validated shape for exports, nesting, 3D and the v2 sim.
**Decision:**

1. **Segment shape.** Every segment stores `from` and `to`, so a consumer can read one segment alone. Continuity (and closure of stitch and cut paths) is checked to 0.01 mm by a Zod refinement.
2. **Unit renames** against SRS §6.3 (SRS updated in the same PR): `seamAllowance` -> `seamAllowanceMm`; `bbox.w/h` -> `bbox.widthMm/heightMm`; `Edge.from/to` -> `fromSegment/toSegment`; check `measured/expected` -> `measuredMm/expectedMm`.
3. **Check ids.** `ValidationCheck.id` is `FR-VAL-01`..`FR-VAL-08` or `FR-MEAS-01`; an optional stable `code` (e.g. `MEAS_WAIST_ABOVE_BUST`) lets #125 report measurement errors without a new id per code.
4. **JSON Schema** is generated with Zod 4's native `z.toJSONSchema` (no dependency). The refinements (continuity, closure) do not appear in it; they are enforced by Zod only.
