# ADR-132 · 2026-10-17 · Core validation rules and stable report codes

**Context:** Issue #132 (FR-VAL-05, FR-VAL-06, FR-VAL-08, FR-VAL-09, NFR-06). Plan: `docs/plans/132-validation-report-structural-checks.md`.
**Decision:**

1. **One rule represents one failure mode.** Several rules can share the same `FR-VAL-xx` id, while each failure has a stable code. Passing rules use the shared `STRUCT_OK`, `LABELS_OK` or `PLAUS_OK` code. This gives the M3 report UI one independently highlightable row per check.
2. **Core rules belong to the registry, not the validate step.** `createRegistry(modules, coreRules)` returns applicable core rules first and module rules second; each group is sorted by requirement id and stable code. Tests can still create a registry with no core rules.
3. **The default fabric width remains 1400 mm.** It is already the engine default. The width rule measures the cut path perpendicular to the grain line and doubles a piece marked `onFold`, because that is the dimension that must fit across the fabric.
4. **Negative ease uses the drafting resolver.** The rule calls `resolveDraftInputs`, so its warning reads the same total bust, waist, hip and upper-arm ease used by the blocks. The resolver is injectable only for a focused test while the current profiles never resolve below zero.
5. **Rules report problems and never repair them.** Every failure or warning carries measured/expected values when meaningful and piece or edge refs when the pattern viewer can highlight geometry.
