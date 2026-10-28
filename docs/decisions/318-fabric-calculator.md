# ADR-318 · 2026-10-28 · The fabric calculator saves on its own and opens with the saved result

**Context:** #318 puts the nesting of #315 and #316 on the saved-version page. The screen is `docs/design/screens/FabricCalc.dc.html`; the API of #317 stores one row per version and options.
**Decision:**

1. A successful, complete run (every piece placed, every length above 0) is saved automatically with `PUT /api/versions/:id/fabric`. There is no "save" button. A failed save shows the standard toast and keeps the result on screen. An incomplete result (a piece does not fit) is never saved.
2. The page opens with the saved options in the form and the saved lengths, and does not run the worker. Recalculation is explicit ("Recalculate"). A saved result stores placements but not the drawing, so the marker diagram appears after a recalculation; until then the panel says so. If the stored `nestingVersion` differs from the current one, a one-line note offers a recalculation.
3. The worker drafts the pattern again from the version's stored inputs (ADR-281 item 2) and answers with lengths, placements, one marker scene per fabric kind and the pieces that do not fit with their names. Steps reported: `draft`, `nest` (`fabricResult` runs preparation and placement together, so per-kind steps are not available). The latest request wins and cancel restarts the worker, as for the export (ADR-289).
4. The bundle guard has a third group, `nesting`, found by the piece-order array `["area","width","length"]`. Dependency-cruiser allows `@tafsila/nesting` in the nesting worker, its handler and the protocol types only; the one-line `@tafsila/nesting/version` (the version string for the older-version note) is allowed anywhere.
5. The calculator and the recommendations are two sections of the same version page. The design's tab switch between them is not built: both are visible, which keeps the page one scroll.
6. The form is a controlled form over plain values with `fabricOptionsSchema` as the validator (`model/fabric-form.ts`), not React Hook Form: five fields, one submit, and the cm-to-mm conversion needs a custom read anyway.
7. The marker diagram draws the strip horizontally (x along the selvedge, fold on top) instead of the design's vertical strip, so it needs no rotation of text and uses the full width on a phone. Zoom is buttons only (in, out, reset) over a pure view-box model.

**Reason:** Saving on its own means a user who calculates never loses the result and the next open is instant. Showing the saved lengths without a worker run keeps the page fast; the drawing is cheap to regenerate when asked.
**Alternatives:** A save button as in the design (one more step, easy to forget); running the worker on every open (a 3 s wait for a number already stored); storing the scene (a large row for data that can be rebuilt).
