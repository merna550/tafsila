# ADR-247 · 2026-10-25 · Pattern options panel

**Context:** The pattern page needs client, measurement set, ease, seam allowance and fabric width in one panel (FR-MEAS-06, FR-PAT-03). The approved screen (`PatternOptions.dc.html`) shows one seam allowance field; the issue and the engine have five edge kinds with different defaults (hem 3 cm, sides 1.5 cm).
**Decision:**

1. The panel is controlled: `PatternOptionsPanel({ value, onChange, preselectClientId?, onSave? })` keeps no saved state; the pattern page keeps `value` in its state. An optional save button (disabled without client and set) matches the screen.
2. Five seam allowance fields (one per edge kind) with "reset" per field and for all, instead of the screen's single field, so no engine default is lost. A single "all edges" shortcut can be added later if Merna wants it.
3. Ease uses the screen's segmented control; the three values come from `EASE_TOTAL_MM` through `@tafsila/engine/measurements` (constants only, so the geometry stays out of the main bundle). Fitted and loose show the "suggested, not final" note (ADR-126).
4. `sizeLabel` is the set's size label, else its name; `clientLabel` is the client name, omitted when empty. `buildEngineOptions`, the default fabric width and the UI limits (seam allowance 0 to 5 cm, fabric width 50 to 300 cm) live in `@tafsila/schemas`, so the browser and the API build identical options.
5. Choosing a client selects her newest set; `?clientId=` applies only while no client is chosen.
6. The centimetre parser moved from the design picker to `shared/format` (two features use it).
   **Reason:** one source for numbers; the page can compose the panel without knowing its internals.
   **Alternatives:** a single seam allowance (loses the 3 cm hem default); ease cards (the screen uses a segmented control).
