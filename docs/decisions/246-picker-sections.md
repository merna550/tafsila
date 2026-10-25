# ADR-246 · 2026-10-25 · Picker sections table and override limits

**Context:** Every feature of the catalogue must be choosable by hand (FR-DES-06, FR-DES-05) without one component per feature, and the length overrides need limits the UI must not invent.
**Decision:**

1. One table `FIELDS_BY_SECTION` and one generic `SectionPanel`; a test fails when an engine feature path is not listed, so a new path cannot be forgotten.
2. Override limits are an engine export, `OVERRIDE_LIMITS_MM`, whose minimums are the engine's own clamps; the UI has no numbers of its own. Maximums are fixed upper bounds because the body is not known in the picker; the body-specific check stays in the engine report.
3. An empty override box removes the override (the engine default applies); an empty slit length returns to the picker's slit length.
4. Refusal reasons come from the engine texts; option names come from messages.
   **Reason:** no category or limit is copied into the UI.
   **Alternatives:** a component per feature (duplication); limits typed in the UI (drift from the engine).
