# ADR-249 · 2026-10-25 · The report panel only emits click targets; the page highlights and zooms

**Context:** #249 shows the validation report beside the viewer (FR-VAL-09) and must point at the problem on the pattern.

**Decision:**

1. The panel never draws on the canvas: it reports the chosen row and its targets; the page sets `highlight` and calls `zoomTo` (one place owns each effect). The dev host page shows the wiring until the pattern page (#251).
2. Refs are resolved by the engine's `resolveRef` (#243), not parsed in the UI; refs that name no piece (for example `front/waist`) leave a plain row with no select action.
3. `FR-MEAS-01` checks are returned separately as `formLevel` for a form-level message (#247, #251); they are never rows.
4. Status is shown by icon plus a status word (read by screen readers, hidden visually as in the approved screen); colours only reinforce.
5. Passes sit in a closed `<details>`; failures then warnings are always visible.
6. No seed design produces a warning or failure, so the dev host adds two demo checks (`dev-report.ts`) pointing at real edges and darts of the seed dress.
