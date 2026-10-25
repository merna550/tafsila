# ADR-243 · 2026-10-25 · The pattern viewer draws an engine scene and is controlled by props

**Context:** The pattern page (#251) and the panels around it (#248, #249, #253) share one viewer (issue #243); the web app must not run geometry and its unit tests have no DOM.

**Decision:**

1. The viewer draws from an engine `PatternScene` built in the preview worker (`buildPatternScene`); the UI never computes geometry. The worker answer carries `scene` next to `result`.
2. Layers, selection, highlight and measure are controlled by props (`PatternViewerProps`); zoom and pan are internal and driven through a ref handle (`fit`, `zoomTo`).
3. Pointer Events handle mouse, touch and pen with one code path; a pinch is two pointers. `touch-action: none` on the canvas.
4. The canvas is `dir="ltr"` and never mirrors; only the buttons follow the locale. Arrow keys move the content in physical directions.
5. State hook `useViewerState` is plain React (no Zustand yet); layers persist in `localStorage` (`tafsila.viewer.layers`) only as a per-viewer convenience.
6. Zoom, pan and pinch maths are pure functions in `model/`; real gestures are covered by Playwright because web unit tests have no DOM.
7. `@tafsila/engine/viewer` exports only types, `resolveRef` and `measureBetween`, so the main bundle stays free of drafting code (guard: `scripts/check-engine-chunk.mjs`, and a test that fails on `@tafsila/engine/geometry` or `samplePath` in `apps/web/src`).
