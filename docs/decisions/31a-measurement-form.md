# ADR-31a · 2026-10-13 · Measurement form: default chart, overrides, units (Part A)

**Context:** Issue #31 builds the measurement form (FR-MEAS-01, -02, -05) in two PRs. Part A is the data, the API and the feature's model; Part B is the screens.

**Decision:**

1. The default size chart comes from a data migration (`20261013120000_default_size_chart.sql`), not the seed, so local, CI and staging have the same chart. Its values are the demo chart from `packages/test-fixtures` (S-XXL, 18 measurements each); the SQL is generated from the fixture (`size-chart-sql.ts`) and a test fails when they drift. The seed's partial chart is removed. Merna's real chart replaces the values in #32; until then staging shows demo sizes.
2. `GET /api/size-charts/default` (auth required) returns `{ id, name, sizes }`; `404 SIZE_CHART_NOT_FOUND` when no system chart is default. The web app caches it for the session.
3. Overrides are not stored. A field counts as changed when its value differs from the set's size in the current chart (`diffFromSize`). If #32 edits the chart, old sets may show more changed fields; accepted before the beta.
4. Units: users type centimetres with at most one decimal (Western or Arabic-Indic digits, `.` `,` `٫`); data is whole millimetres. `formatCm` moved to `packages/utils` and replaces the clients feature's local `mmToCm`.
5. Validation runs in the browser with `validateMeasurements` from `@tafsila/engine` (added to `apps/web` dependencies; already in `transpilePackages`). Errors block saving; warnings do not. The engine runs on every change for the save button and is debounced 200 ms for the messages.
6. Field groups (9 / 3 / 6) are one typed list, `FIELD_GROUPS`; a test checks it covers every contract key once.
7. `useDebouncedValue` moved from the clients feature to `shared/hooks` because two features use it.
8. Hook interaction is not tested with a DOM (none is installed, see ADR-30a-10); the rules live in pure functions (`form-state.ts`) that are unit tested.

**Reason:** Matches the approved plan; keeps the screens (Part B) thin.

**Alternatives:** chart in the seed (staging would have none); storing overrides (schema change for little value); server-side only validation (no live feedback).
