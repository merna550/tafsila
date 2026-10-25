# ADR-287 · 2026-10-25 · Projector pieces: offset plus 0/180, keys move the active piece

**Context:** FR-PROJ-04 lets the user project one piece or the full layout and move or turn pieces to fit the fabric. [ADR-286](286-projector-view.md) gives the view, `screenDeltaToSceneMm` and the keymap; the approved screen is `docs/design/screens/Projector.dc.html`.
**Decision:**

1. A placement is an offset from the scene layout in scene mm plus a rotation typed `0 | 180`. Single-piece mode only filters the pieces and centres the view once, so the same numbers mean the same in both modes. The engine scene is never changed.
2. Arrow keys (1, Shift 10, Alt 50 mm) move the active piece, otherwise they pan. A press on a piece makes it active and dragging moves it; dragging empty canvas pans. Escape clears the active piece; `R` turns it by 180 degrees; `0` resets all placements and the pan; `L` shows or hides the piece list; Page Up/Down step through pieces; `A` shows all.
3. Rotation is about the centre of the piece's cut box, so size and place stay; `rotate180` is the only rotation function, so no other angle can exist.
4. Selection and placements are saved per viewer and version in `tafsila.projector.placement.<versionId>` (try/catch, Zod-checked, pruned to the scene on read); the active piece is not saved; nothing goes to the server.
   **Reason:** the physical use is placing paper-sized pieces on fabric; one offset model and physical key directions keep it predictable, and 0/180 keeps the grain line parallel to the fabric grain.
   **Alternatives:** free rotation (breaks the grain, out of scope); storing absolute positions (breaks when the engine layout changes); server storage (not needed for a per-table fitting aid).
