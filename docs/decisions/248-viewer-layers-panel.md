# ADR-248 · 2026-10-25 · The piece panel is a pure view over a scene piece and layers are five checkboxes

**Context:** The viewer (#243) is controlled by `ViewerController`; #248 adds the layer toggles, a piece list and a details panel (FR-VIEW-01, FR-VIEW-02).

**Decision:**

1. The panel is a pure view over a `ScenePiece`; selection stays in `ViewerController` (one source for canvas, list, panel and the report).
2. Layer toggles are five checkboxes as in the approved pattern-page screen: stitch line, cut line (shown as "seam allowance"), notches, names, grid.
3. Edge rows show the engine edge id: the engine has no localised edge names, and adding them is an engine content change outside this issue.
4. Cut text uses ICU plurals in next-intl (Arabic one, two, few and many forms).

**Consequences:** The numbers come from the scene (engine measured), so the UI only converts mm to cm. Naming edges for people is a later engine content issue.
