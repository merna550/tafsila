# Plan: #249 validation report panel with edge highlight

Approved plan comment: https://github.com/merna550/tafsila/issues/249#issuecomment-6273981197

Summary: pure `reportRows(report, scene)` model (failures, warnings, passes, `formLevel` for FR-MEAS-01; targets via `resolveRef`), `ValidationReport` and `ReportRow` components (icon + status word + message + values in cm, passes in a collapsed `<details>`, rows with refs are buttons), highlight wired in the page (`setHighlight` + `zoomTo`), messages `patternViewer.report.*`, tests, test cases, decision 249.

## Deviations

- Props follow the merged viewer contract: `ValidationReport({ report, scene, selectedKey, onSelect(key | null, targets) })`; the panel handles "choose again clears". The row key is `id-code-index`.
- The status word is visually hidden (screen readers read it), as in the approved screen, which shows only the icon; the issue's "icons with text" is met for assistive technology.
- Dev host adds two demo checks (`dev-report.ts`) because no seed gives a warning or failure.
- Escape clears the piece selection (#243), not the highlight; choosing the row again clears the highlight.
- No visual baselines (no Docker here): listed in the follow-up #265.
