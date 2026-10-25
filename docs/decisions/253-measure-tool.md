# ADR-253 · 2026-10-25 · The measure tool measures straight lines between snap points

**Context:** FR-VIEW-03 asks for the distance between two points on the pattern (#253). The viewer contract (#243) already types `measure` and `onMeasureChange`.

**Decision:**

1. Only straight-line distance between snap points (stitch corners and notches); free points and curve length are out of scope.
2. Snap radius 16 px and tap tolerance 6 px are named constants (`SNAP_RADIUS_PX`, `TAP_SLOP_PX`).
3. The distance comes from the engine `measureBetween`; the UI only converts mm to cm.
4. The keyboard path is two selects listing the snap points, not canvas cursor movement.

**Consequences:** Measuring a curve needs a later issue. Dense points on small pieces resolve by zooming in, because snapping works in screen pixels.
