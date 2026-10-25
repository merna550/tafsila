# ADR-251 · 2026-10-25 · Pattern page: routes, stores and save states

**Context:** The pattern page composes the editor, options, viewer, report and save (FR-PAT-04, ADR-236). Several merged features own a part of the state.
**Decision:**

1. `/designs/[id]/pattern` is the pattern page; `/designs/[id]` stays the section editor and links to it. `?clientId=` is kept in both.
2. The spec stays in the editor store; the options and the base version live in a page store. One dirty flag is derived from both; the leave warning is the browser's `beforeunload`.
3. The preview uses the live measurement set, so client and server hash the same inputs. A saved version whose hash differs while nothing was edited is `outdated`, not `saved`.
4. A draft is stale when the preview state's `input` is not the page's current input object; no hashing in the main bundle (the `check-engine-chunk` guard stays green).
5. Save states are one pure function with a fixed order; Save is enabled only for `unsaved` and `outdated`.
6. A 422 `PATTERN_INVALID` shows the server's report in the report panel with a banner; `ApiError` keeps `report`. Other errors use the shared handler (toast).
7. `/dev/pattern-preview` is removed; `/dev/pattern-viewer` stays for gesture specs.
   **Reason:** keeps the picker untouched, keeps geometry out of the main bundle, and makes every save state testable without React.
   **Alternatives:** options inside the editor store (changes #244's draft format); hashing in the browser (risks a hash that differs from the engine's parsed one).
