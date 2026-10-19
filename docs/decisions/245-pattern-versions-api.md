# ADR-245 · 2026-10-19 · Pattern versions API: server re-runs the engine, append-only, dedupe against current

**Context:** Issue #245 adds save, list, read and restore for pattern versions (tables from #237, scope from ADR-236, schema from ADR-242).
**Decision:**

1. **"Same inputs return the existing version"** means the same `input_hash` as the design's **current** version (double-submit and retry safe). Restoring an older version always appends n+1; `input_hash` is therefore not unique.
2. **The design row is locked `for update`** in the save transaction; `version_no = max + 1` and `current_version_id` change together or not at all.
3. **Restore** uses the stored measurements snapshot (not the live set), re-runs today's engine and copies `measurement_set_id`. A version today's engine now fails cannot be restored (422 `PATTERN_INVALID`).
4. **`sizeLabel`** = the set's size label, else its label; the client name is snapshotted into `options.clientLabel`.
5. **Request `options`** = seam allowance and fabric width only. Ease is its own field; size and client labels come from the server.
6. **Combination refusals** come from the engine report (one rule source); a `fail` report is never stored and answers 422 `PATTERN_INVALID` with `details.report`.
7. **Save and restore answer 201** (new) or **200** (reused) with `{ version, report, reused }`; read regenerates and never writes.
8. **Engine time** goes to the `Server-Timing` header and the `pattern_version_saved` event (category, status, ms, reused; no measurements). No new logger port.
   **Reason:** Cheap, retry-safe saves on Supabase Free, one rule source, history that cannot be edited.
   **Alternatives:** unique `(design_id, input_hash)` (blocks restore); trusting the client's report (breaks ADR-002).
