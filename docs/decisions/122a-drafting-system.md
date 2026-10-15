# ADR-122a · 2026-10-15 · Block drafting system: Aldrich metric blocks, Egyptian chart, derived lengths

**Context:** Issue #122 (SRS §13 item 2, FR-PAT-01, NFR-01). ADR-122 left the system for the bodice, skirt and sleeve blocks to Merna. This file has the letter `a` because `122-m2-engine-scope.md` already holds ADR-122 (the issue makes a second decision).
**Decision (Merna, 2026-10-15):**

1. **System.** Winifred Aldrich, _Metric Pattern Cutting for Women's Wear_, **6th edition (2015, Wiley-Blackwell)**, the metric made-to-measure blocks, adapted to our measurement set. One edition is named because page numbers differ between editions. FreeSewing is only a cited reference for curve construction (ADR-122), not a dependency.
2. **Reference chart.** The reference drafts use `egyptianSizeChart` (#158, PR #159) for sizes S, M and XXL, not the demo chart. The chart's waist and 14 other measurements are derived (ADR-158), so the drafts prove the method and the code, not the fit on real bodies.
3. **Missing lengths are derived, with no schema change.** Armscye depth, back width, chest width, shoulder length and dart sizes are computed from our fields with ratios taken from the book's size chart, as named constants (`DRAFT_CONSTANTS`).
4. **Details settled by the author (cheap to reverse):** `bustHeight` is HPS to bust point (SRS §6.2; the engine README said "shoulder point" and is corrected); bust and waist ease are split equally between back and front; the bust dart scales with the bust and ignores cup size; the page column of `drafting-method.md` is filled in by Merna from her copy.

**Reason:** One documented, citable system makes every block checkable to ± 1 mm and keeps the fit decision with the sewing expert. Deriving lengths avoids asking users for four more measurements (FR-MEAS keeps its 18 fields). Using the Egyptian chart tests the sizes the product is built for.
**Alternatives:** FreeSewing's core as the method (its plugin model and units differ from `PatternResult`; ADR-122); a schema change adding armscye depth and back width (more form fields, a migration, a worse flow); the demo chart as reference (not the target market).
**Open:** the author had no copy of the book; the constants and the step order need Merna's check ("Checklist" in [drafting-method.md](../engine/drafting-method.md)). A changed constant means regenerating the fixture, not changing code.
