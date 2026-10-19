# ADR-236 · 2026-10-19 · M3 scope: browser preview, server-checked versions, no credits, placeholders

**Context:** M3 (Design & pattern UI) turns the M2 engine into a usable flow: build a design by hand, see a validated pattern for a saved client, save versions (SRS §12). The brief is `docs/milestones/M3-design-and-pattern-ui.md`, issues #236-#254. Several points were not written down: where the engine runs, what a version stores, credits, the measurement source, compare, illustrations, and which open M2 bugs M3 waits for. All are cheap to change before the beta (no production data, ADR-026).
**Decision:**

1. **Engine in two places.** The browser runs `generatePattern` in a Web Worker for the live preview (FR-PAT-04, #239). The API re-runs it when a version is saved and its report is the one stored (SRS §8, #245). Both use the engine's `input_hash`.
2. **A version stores inputs, not the result.** `pattern_versions` keeps the spec, a snapshot of the measurements (the set can be edited or deleted later; `measurement_set_id` becomes null on delete), size label, ease, options, `engine_version`, `validation_status` and `input_hash`. The `PatternResult` is regenerated when read (the engine is deterministic, NFR-08); a version made by another engine version shows a notice. This keeps the database small on Supabase Free (ADR-022).
3. **History is append-only.** Versions are never updated or deleted on their own; "restore" saves a new version with the old inputs. Saving the same inputs again returns the existing version.
4. **A failing pattern is not saved.** A `fail` report gives 422 `PATTERN_INVALID` with the report; `pass` and `warn` are saved. The unsaved design stays in the editor (browser storage per viewer).
5. **No credits in M3.** Saving versions is free until M7 adds FR-BILL-01 (one credit for a new design, none for regenerations).
6. **Measurements always come from a saved measurement set.** A pattern for a standard size without a client is out of M3; the user saves a set from a size (FR-MEAS-05) first.
7. **Compare two versions (overlay) moves to M6** with chat edits; M3 builds list, open and restore of FR-CHAT-05.
8. **One rule source for the picker.** `specOptions`, `defaultSpec` and `normalizeSpec` in the engine (#238) read the existing combination tables, so the UI never repeats engine rules.
9. **Option drawings are placeholders** until the beta, like the measurement guide drawings (FR-MEAS-02); swapping one is a file change.
10. **Screens first.** UI issues match designs copied to `docs/design/screens/` by #236 (ADR-97).
11. **Seam allowance in the UI is global per edge kind** (FR-PAT-03); per-edge overrides stay in the engine options with no UI yet.
12. **Engine bugs.** M3 builds do not wait for the M2 exit (#148). The M3 exit (#254) waits for #229, #230, #231 and #232, because they break combinations the picker offers. #218, #224, #226, #233 and #234 do not block M3 (the preview runs in a worker, so #233 does not freeze the page).
13. **FR-VIEW-03 measure tool** is in M3 at `priority:P3` (#253), the first issue to cut if time runs short.

**Reason:** Live editing needs the engine in the browser, and the stored report must not depend on the client. Storing inputs instead of geometry fits the free tier and the deterministic engine. Free versions keep M3 independent of billing. One rule source avoids the UI and the engine disagreeing.
**Alternatives:** Engine only on the server (a network round trip per change, misses FR-PAT-04); store the full `PatternResult` per version (large rows, a second source of truth); save failing versions (broken patterns in the history); charge credits now (needs M7 first); include compare in M3 (the overlay is most useful for chat edits).
