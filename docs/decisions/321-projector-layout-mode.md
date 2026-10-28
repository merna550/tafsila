# ADR-321 · 2026-10-28 · The projector shows a fabric marker as a layout mode of the same route

**Context:** FR-FAB-04 asks to project the whole computed marker at 1:1 and cut every piece in place. The projector (ADR-286, ADR-287) already has calibration, the verification square, pan and mirror; the saved calculation (ADR-318) keeps placements but not the drawing.
**Decision:**

1. Layout mode is the query parameter `?layout=main|lining|interfacing` on the existing projector route, not a new route. An unknown value gives the pattern projector. The calibration page keeps the parameter so the user comes back to the layout.
2. The scene is rebuilt by the nesting worker from the options of the saved calculation (`useLayoutScene`); nothing new is stored. With no saved calculation the screen says to calculate first and links to the calculator.
3. Rotation is off and the piece list is replaced by the kind label with its length ("Main fabric, 1.3 m"); pieces cannot be selected or moved, so arrow keys always pan (ADR-312 item 9: the layout fixes the grain). A "Back to the start" button (key 0) returns to the start of the strip.
4. The marker scene is converted to the pattern scene shape so the existing canvas draws it; the fold is a solid line and the selvedge a dashed one (`data-layer="fold|selvedge"`).
5. Pan bounds come from the scene size and the screen size in mm: the view starts with the beginning of the strip at the screen edge, and the far end can be reached but no further (20 mm margin).

**Reason:** One projector means one calibration, one set of keys and one verification square to trust. Rebuilding the scene costs a few seconds on opening and saves a large row.
**Alternatives:** A new route (duplicates the page and the calibration guard); storing the scene (large row, can go stale); an unclamped pan (a 3 m strip is easy to lose off screen).
