# ADR-252 · 2026-10-25 · Version history: list, read-only view, restore

**Context:** FR-CHAT-05 needs a version list, a way to look at an old version and a restore (ADR-236 items 2, 3, 7). The approved screen is `VersionHistory.dc.html`.
**Decision:**

1. History is `/designs/[id]/versions`; an old version is `/designs/[id]/versions/[versionId]`, view only. The editor and page stores are not touched by opening one.
2. The read-only view draws the stored inputs in the preview worker; the server's `engineChanged` flag drives its badge. In the list, a row is "older engine" when its `engineVersion` differs from `ENGINE_VERSION` (read through `@tafsila/engine/version`, not the engine barrel).
3. Restore asks first (and warns when unsaved edits of this design would be replaced), calls `POST /versions/:id/restore`, shows the number the server answers with ("Restored as version N", or "Already version N" when reused), puts the result in the stores when this design is loaded, and goes to the pattern page.
4. No API change: the list has no client name; the read-only view reads it from the version's measurement set.
   **Reason:** matches the approved design, keeps the geometry in the worker chunk and the server as the only source of version numbers.
   **Alternatives:** `?v=` on the pattern page (mixes read-only into the editor page); showing the server's regenerated pattern (needs the scene builder in the main bundle).
