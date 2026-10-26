# ADR-291 · 2026-10-26 · Direct-cut checklist screen

**Context:** #291 builds the direct-cut checklist (FR-CUT-01 to FR-CUT-03) on top of the engine's `cutSteps` (ADR-284), in the browser (ADR-281).
**Decision:**

1. **Steps are worked out in the preview worker** through a second message type (`kind: "cut-steps"`). One adapter (`shared/pattern-preview/cut-plan.ts`) maps the engine's `CutSteps` to the UI `CutPlan` and fills both languages with `@tafsila/engine/cut-text`, so `apps/web` never imports engine geometry.
2. **The reference steps are not ticked.** They become the piece's reference text; the first tick box is the first marking step, as in the approved screen.
3. **Ticks are keyed by version and curve step** (`tafsila.cut.ticks.<versionId>.<curveStepMm>`), store the engine version and are ignored when it differs. The curve step is a per-viewer setting (`tafsila.cut.settings`), default 25 mm.
4. **Numbers:** the engine prints cm with one decimal and Western digits (NFR-06). `localizeDigits` can convert to Arabic-Indic; there is no digits setting yet, so the screen uses Western.
5. **Print:** the same page. `PrintSheet` shows on screen in the "Print view" state and in `@media print`; it never reads tick state (empty boxes, borders not fills) and prints one piece per page with the version and engine version.
6. **Labels are the engine's Latin letters**, as ADR-284 item 4 says; the approved mock's Arabic letters are not used.

**Reason:** One adapter isolates the engine type; storage-only ticks need no API (ADR-281 item 2); a stale tick after an engine change would mark a step the tailor did not do.
**Alternatives:** Computing steps on the main thread (breaks the engine chunk rule); one tick set for all curve steps (their step lists differ); a separate print route (a second screen to keep in sync).
