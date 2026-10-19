# ADR-146 · 2026-10-19 · Sewing order

**Context:** Issue #146 (FR-PAT-06, NFR-06). Plan: [`docs/plans/146-sewing-order.md`](../plans/146-sewing-order.md). Cheap to reverse: the texts are one catalogue file and the seam rules are one table; no geometry depends on the order. Status: accepted, pending sew-test (the follow-up from this PR).
**Decision:**

1. **Phases** (`SEWING_PHASES`): prepare, darts, shoulders, neckline, sleeves, side-seams, waist-seam, closure, waistband, hem, finish. `waist-seam` is new, so a centre-back zip crosses an already joined waist.
2. **Steps come from the finished pieces.** A rule table maps each seam (by piece and edge ids and the closure) to a catalogue key; piece-level jobs (fuse interfacing, gather, darts, hem, buttonholes) come from the pieces and spec. Text comes only from `SEWING_CATALOGUE`, which also holds each key's phase and action; the key order is the order inside a phase.
3. **Refs** are `piece/edge`, `piece/dart:<id>` or a bare `piece`.
4. **Coverage rule:** every unique seam (a self pair once) is named by exactly one `sew` or `attach` step. A gap or a duplicate throws `DraftingError` (`SEWING_PAIR_UNCOVERED`, `SEWING_PAIR_DUPLICATED`); unknown seams fall to a generic step so a new module never crashes the engine. `sewingCoverage(result)` is exported for #147.
5. **The neckline phase stays before the closure phase** (facing ends are turned over the zip tape in `finish`); the sew-test may move this.
6. `ENGINE_VERSION` 0.16.0: every result now has a sewing order.
