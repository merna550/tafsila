# ADR-342 · 2026-11-03 · Confirmation screen

**Context:** Issue #342 (M6, ADR-335 item 5) is the screen after the analysis: the person confirms or corrects every feature the AI read (FR-DES-03, FR-DES-04, FR-DES-05, FR-DES-07).

**Decision:**

1. The confirmed spec travels to the pattern page as the editor's browser draft through one exported function, `seedEditorDraft` of the design picker. No new API and no new column. A PATCH of the design's spec is a later decision if drafts prove fragile across devices.
2. A feature with no confidence value counts as confirmed (the model gave none).
3. "Continue" waits only for features below 0.6 (`LOW_CONFIDENCE`), not for every feature.
4. The analysis category wins over the chosen category when they differ; the draft's base is the default spec of the design's own category, so the editor accepts it.
5. Edits reuse the picker's choice cards, `rawFeatureEdit` and `normalizeSpec`, so incompatible features are corrected and the "we changed X" notice shows. The screen's state is local (a reducer), not Zustand.
6. The photo thumbnails of the design file are left out for now: the screen has no signed photo URLs yet.

**Reason:** None is costly to reverse. A browser draft reuses the saving path of manual designs.

**Alternatives:** write the spec to the design through the API (a new endpoint and a migration for one screen); require every feature to be confirmed (slow for a tailor with a clear photo).
