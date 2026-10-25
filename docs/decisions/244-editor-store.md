# ADR-244 · 2026-10-25 · Editor store, sections and spec-rules import

**Context:** The design picker (FR-DES-06) needs one place for the spec being edited, and must not load the pattern geometry into page bundles (#239).
**Decision:**

1. The Zustand store holds the spec, the baseline and a one-level undo only; server data stays in TanStack Query. Dirty means the spec differs from the baseline. The pure steps live in `model/editor-state.ts`.
2. Sections are derived from `specOptions(...).applies`, never from a second category table.
3. Routes: `/designs/new?clientId=` and `/designs/[id]?clientId=&section=`. The design is created when the category is chosen (an unused design can exist; deleting is in #250).
4. The browser draft key is `tafsila.editor-draft.<designId>`; it is used only when its `baseSpec` equals the loaded spec.
5. Spec rules are imported from `@tafsila/engine/spec-rules`, which must not reach the geometry kit; `check-engine-chunk` guards this.
   **Reason:** keeps the main bundle small and the editor state testable without React.
   **Alternatives:** keep the whole spec in TanStack Query (no undo or draft); derive sections from a category table (a second source of truth).
