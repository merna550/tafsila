# ADR-242 · 2026-10-19 · Designs API: default title, shared version schema, cheap reads

**Context:** Issue #242 adds create, list, read, rename and delete for designs (tables from #237, scope from ADR-236). Several small points were not written down.
**Decision:**

1. **Default title** = category word in the profile language (fallback Arabic; words in `docs/design/copy.md`) + the date in Africa/Cairo (`YYYY-MM-DD`), taken from the `Clock` port. The user renames it.
2. **`patternVersionSchema`** (stored inputs, no result) lives in `packages/schemas/src/designs.ts` and is shared with the version routes (#245).
3. **`GET /api/designs/:id` returns the current version's inputs only.** The regenerated pattern comes from `GET /api/versions/:id` (#245), so a design read stays cheap.
4. **`summary.clientName`** is the client of the current version's measurement set; null when there is no version, the set or the client is gone.
5. **List order** is `updated_at desc` (saving a version touches the design in #245).
6. **`escapeLike`** moved to `adapters/supabase/escape-like.ts`, used by clients and designs.
7. Validation errors keep the catalogue status (400 `VALIDATION_FAILED`); no new error code.
   **Reason:** Cheap list and read paths on Supabase Free, no duplicated helpers, one schema for a version.
   **Alternatives:** UTC date in the title (wrong day after 22:00 in Cairo); version list inside the design read (grows without bound).
