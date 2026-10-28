# ADR-319 · 2026-10-28 · Fabric recommendation panel on the saved-version view

**Context:** FR-REC-02 needs the user to see which fabrics suit a saved design and which to avoid. The recommend endpoint (#317) returned only fabric ids, so the screen had no names or properties to show.

**Decision:**

1. **The recommend response carries a catalogue summary.** Each `recommended` and `avoid` item gains `fabric: { id, nameAr, nameEn, properties }`, joined on the server from the catalogue it already loaded. The screen needs one request, and an admin edit (new fabric, renamed fabric) shows at once. Considered and rejected: reading names from `DRAFT_CATALOGUE` in the browser (would hide admin edits) and a public catalogue endpoint (a second request for no gain).
2. **Panel on the saved-version view only**, no route of its own; for an unsaved pattern nothing is shown ([ADR-281](281-m4-scope.md) item 1). It is one import into the version page.
3. **Fetch on mount, 5-minute `staleTime`, no polling.** The catalogue changes rarely.
4. **Properties as a five-step meter plus a level word for screen readers**, as in the screen design; level `n` (0 to 4) fills `n + 1` steps. Stretch is not shown (0 for every woven fabric in v1).
5. **The first item is "Best fit"**; the draft note shows while the response has `isDraft`.

All are cheap to reverse (no production data, ADR-026 in [DECISIONS.md](../DECISIONS.md)).
