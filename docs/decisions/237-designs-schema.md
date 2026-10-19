# ADR-237 · 2026-10-19 · designs and pattern_versions schema

**Context:** Issue #237 adds the M3 tables under [ADR-236](236-m3-scope.md) items 2-4.
**Decision:**

1. Composite FK `(design_id, owner_id)` on `pattern_versions`, so a version can never belong to another user's design.
2. No unique constraint on `(design_id, input_hash)`, only an index. "Same inputs return the existing version" is an API rule against the design's current version (#245), because a restore must be able to add a new version with an older version's inputs.
3. `validation_status` allows only `pass` and `warn`; failing patterns are never saved.
4. `pattern_versions` is append-only: `authenticated` has select and insert only.
5. `version_no` is assigned by the API in one transaction (`max + 1`); the unique `(design_id, version_no)` is the race guard (retry once on conflict).
6. `title` is 1-120 characters; `category` is limited to `dress`, `skirt`, `blouse` (a new category is a migration).
7. `designs.updated_at` is set by the API; no trigger (M1 has none).
8. `designs.current_version_id` is a deferrable FK added after both tables, `on delete set null`.

**Reason:** The database refuses cross-user access on its own (ADR-035), and the history stays trustworthy.
**Alternatives:** Unique `input_hash` (blocks restore); a per-design sequence for `version_no` (extra object for no gain); an `updated_at` trigger (a new shared function for one table).
