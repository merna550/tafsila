# Plan: #247 pattern options panel

The approved plan is the latest plan comment on issue #247: <https://github.com/merna550/tafsila/issues/247#issuecomment-6274022611>.

## Deviations

- The panel is built to the approved screen: a segmented control for ease (not option cards) and an optional "save options" button; five seam allowance fields are kept (the screen has one), see ADR-247.
- `patternOptionsInputSchema` was not added: #245 merged with `savePatternVersionInputSchema` taking `seamAllowance` and `fabricWidthMm` from `engineOptionsSchema`. `@tafsila/schemas` gets `buildEngineOptions`, `DEFAULT_FABRIC_WIDTH_MM` and the two limits.
- `useClient` and `useClientMeasurementSets` accept `null` (no request until a client is chosen). Ease constants are exported from `@tafsila/engine/measurements`.
- The cm parser moved to `shared/format/length-units.ts`.
- Component tests render static HTML (the web package has no DOM test environment); the interactions are tested as pure model functions (`autoSelection`, `withClient`, `withSeamAllowance`).
