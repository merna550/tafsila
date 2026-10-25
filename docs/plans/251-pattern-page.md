# Plan: #251 Pattern page with live preview and save version

Plan wave M3, 2026-10-19. Planned together with #247 (options panel) and #252 (version history): this plan fixes the page state, data flow, routes and save states; #247 and #252 follow it. Follows [ADR-236](../decisions/236-m3-scope.md) items 1-4, 6, 10. UI must match the pattern page screen in `docs/design/screens/` once #236 lands (not in the repo yet); routes, interfaces and file names below are fixed so the build does not guess.

### Approach

A thin route renders `PatternPageScreen`, a feature-root screen that calls the hooks and passes props down (like `ClientsScreen`). Data flow, one direction:

```
editor store (#244, Zustand)  { spec, options: PatternOptionsValue, baseVersion, dirty }
   │  spec ← picker sections (#246) · options ← PatternOptionsPanel (#247, controlled)
   ▼
buildPreviewInput(spec, options, set, client) → { spec, measurements: set.measurements, options: EngineOptions } | null
   ▼
usePatternPreview(input) (#239)  → { result, status, inputHash }
   ▼
PatternViewer + layers (#243/#248) and ValidationReport (#249) read `result`
   ▼
saveStateOf(...) (pure) → SaveVersionBar → useSaveVersion → POST /api/designs/:id/versions (#245)
```

**Routes (fixed for #244, #247, #250, #252, #254):**

- `/designs/new?clientId=<id>` (#244) creates the design, then `router.replace("/designs/<id>?clientId=<id>")`.
- `/designs/[id]`: editable; the current version's inputs are loaded. `?clientId=` preselects the client only when the store has no client yet (new design).
- `/designs/[id]?v=<versionId>`: read-only view of one version (#252).
- File: `apps/web/src/app/[locale]/(dashboard)/designs/[id]/page.tsx`, props `{ params: Promise<{ id }>, searchParams: Promise<{ clientId?, v? }> }` → `<PatternPageScreen designId clientId versionId />`.

**Loading.** `useDesign(id)` → if `currentVersionId`, `useVersion(currentVersionId)` → `editor.load({ spec, options, baseVersion: { id, versionNo, inputHash } })`, where `options` comes from `fromVersion(version)` (#247 model). No version yet → the store keeps #244's draft or `defaultSpec(category)`. A browser draft (#244) wins only when its `baseVersion.id` equals the current version id; otherwise it is dropped with a notice (another device saved a newer version).

**Measurements.** The preview always uses the **live** measurement set (from the client's set list, #247), because the server reads the set fresh on save (#245). A deleted set (`measurementSetId` null) means the user must pick a set; no preview, Save disabled.

**Save states (one pure function, `model/save-state.ts`).** `expectedHash = inputHash(previewInput)` from `@tafsila/engine` (hash code only, no geometry; includes `ENGINE_VERSION`).

| kind              | when (first match wins)                                                             | Save button                                               |
| ----------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `loading`         | design or current version loading                                                   | hidden                                                    |
| `no-set`          | no measurement set chosen                                                           | disabled, "choose measurements"                           |
| `previewing`      | preview `running`, or `result.inputHash !== expectedHash` (stale preview)           | disabled, running indicator                               |
| `preview-error`   | preview `error`                                                                     | disabled, shared error display (#239 `preview-error`)     |
| `server-rejected` | last save answered 422 and inputs unchanged since                                   | disabled, server report shown                             |
| `fail`            | `report.status === "fail"`                                                          | disabled, "fix the problems first"                        |
| `saving`          | mutation pending                                                                    | disabled, spinner                                         |
| `saved`           | `expectedHash === baseVersion.inputHash`                                            | disabled, "Saved · version N"                             |
| `outdated`        | not dirty, but hash differs from `baseVersion` (set edited or engine changed since) | enabled, "Measurements or engine changed since version N" |
| `unsaved`         | otherwise                                                                           | enabled, "Save version"                                   |

`canSave(state) = kind in {unsaved, outdated}`. `dirty` (store) drives only the leave warning: `useLeaveWarning(dirty && kind !== "saved")` (existing `shared/hooks/use-leave-warning.ts`) plus an in-app guard on `AppNav` links via the same flag (confirm dialog from `packages/ui`).

**Save.** Body `{ spec, measurementSetId, easeProfile, options: PatternOptionsInput }` (`PatternOptionsInput` from `@tafsila/schemas`, created by #247). On success → `editor.markSaved({ id, versionNo, inputHash })`, invalidate `versionKeys.all` and `designKeys.detail(id)`, toast "Saved as version N" (or "already saved as version N" when the server returns an existing version by `input_hash`, ADR-236 item 3). On 422 `PATTERN_INVALID` → `ApiError.details.report` parsed with the engine's report schema and shown in `ValidationReport` with a banner "The server found a problem"; state `server-rejected` until any input changes. Other errors → `useApiErrorHandler` toast.

### Files

Create:

- `apps/web/src/app/[locale]/(dashboard)/designs/[id]/page.tsx` (above).
- `apps/web/src/features/pattern-page/`
  - `index.ts` (exports `PatternPageScreen` only), `PatternPageScreen.tsx` ("use client"; calls the hooks, composes features only through their `index.ts`: `@/features/design-picker` (#244/#246: editor frame, sections, `useEditorStore`), `@/features/pattern-options` (#247), `@/features/pattern-viewer` (#243/#248), `@/features/validation-report` (#249), `@/features/pattern-versions` (below; #252 adds its panel)). If a merged feature uses another folder or export name, use it as is; no wrappers.
  - `components/PatternPageLayout.tsx` (slots: editor, options, viewer, report, history; phone = tabs, desktop = columns, per the #236 screen), `components/SaveVersionBar.tsx`, `components/PreviewStatus.tsx`, `components/ServerRejectedNotice.tsx`, `components/pattern-page.test.tsx`.
  - `hooks/use-pattern-page.ts` (load design and current version into the store, preview input, save state, save action), `hooks/use-pattern-page.test.tsx`.
  - `model/save-state.ts` + `.test.ts`, `model/preview-input.ts` + `.test.ts` (`buildPreviewInput`, returns null without a set; uses `buildEngineOptions` from `@tafsila/schemas`).
- `apps/web/src/features/pattern-versions/` (data hooks for versions; #252 adds list, restore and the history panel here): `index.ts`, `hooks/query-keys.ts` (`["versions", designId]` list, `["version", id]` one; `versionKeys.all = ["versions"]`), `hooks/use-version.ts`, `hooks/use-save-version.ts`, `model/save-error.ts` (+test: `patternInvalidReport(error): ValidationReport | null`).
- `apps/web/src/features/designs/hooks/use-design.ts` and `query-keys.ts` (`["designs", id]`), exported from `features/designs/index.ts`: create only if #244 or #250 did not already.
- `apps/web/e2e/pattern-page.spec.ts` and `apps/web/e2e/support/pattern.ts` (helpers reused by #252 and #254: `openSeedClient(page)`, `startDesign(page, "dress")`, `chooseOption(page, path, value)`, `waitForReport(page)` → status text, `saveVersion(page)` → version number).
- `docs/test-cases/ui/251-pattern-page.md`.

Change:

- `apps/web/src/features/design-picker/` store (#244): add, if missing, `options: PatternOptionsValue`, `setOptions(patch)`, `load(...)`, `markSaved(...)`, `baseVersion`; `dirty` covers spec and options; the draft persists both.
- `apps/web/src/shared/api/api-error.ts` (+test): keep `details?: unknown` from the error body (needed for the 422 report).
- `apps/web/messages/{ar,en}.json` (`patternPage.*`), `apps/web/e2e/pattern-preview.spec.ts` and the dev route `app/[locale]/dev/pattern-preview/` from #239: move the timing asserts into `pattern-page.spec.ts` and delete both (#239 decision 5).
- `docs/frontend/README.md`: section "Pattern page" (data flow diagram and the save-state table above). `docs/errors.md`: UI placement of `PATTERN_INVALID` (report panel, not a toast).

### Data / API

No new endpoint. Uses `GET /api/designs/:id` (#242), `GET /api/versions/:id`, `POST /api/designs/:id/versions` (#245). Expects the 422 body `details.report` (validation report) and the version response `{ id, versionNo, inputHash, ... }`; if #245 names them differently, follow #245 and update the table here in the PR.

### Tests

- Unit `save-state.test.ts`: one case per row of the table (fixtures: preview `running`; done with a mismatched hash; `fail` report; hash equal to `baseVersion`; not dirty with a different hash → `outdated`; 422 then unchanged → `server-rejected`, then a spec change → `unsaved`).
- Unit `preview-input.test.ts`: no set → null; set M + regular + defaults → options pass `engineOptionsSchema`, `sizeLabel` from the set, `clientLabel` from the client name.
- Unit `save-error.test.ts`: a 422 `PATTERN_INVALID` with a report → parsed report; any other error → null.
- Hook test (fake preview, MSW or the existing API mock): loads the seed design's current version into the store; a 422 shows the server report; success calls `markSaved` and invalidates the list.
- Component: Save disabled for `fail`, `previewing`, `no-set`; "Saved · version 2" shown for `saved`; the page imports features only through `index.ts` (`pnpm depcruise`).
- **E2E `pattern-page.spec.ts` (the dress path #254 reuses, `ar` and `en`, 360 px and desktop):** sign in as the seed user → `openSeedClient` → "New pattern" → dress → `chooseOption("sleeve.type", "puff")` (any allowed value other than the default) → viewer shows pieces and the report reads pass or warn → `saveVersion` = 1 → reload → "Saved · version 1" and the same sleeve. Second test: pick a combination that gives `fail` (fixture chosen in the build from the engine's fail fixtures) → Save disabled. Preview timing for `seedDress` M logged (moved from #239).
- 422 path: Playwright route stub on `POST **/versions` returning the 422 body (the server never stores a fail, so the real API cannot produce it after a passing preview).

Manual test cases `docs/test-cases/ui/251-pattern-page.md`: TC-UI-251-01 dress from a client, save, reload; -02 change measurements of the set in another tab, reopen → "outdated" notice; -03 leave with unsaved changes → warning; -04 phone 360 px tabs; -05 slow phone, type fast, no freeze; -06 English.

### Decisions (build writes `docs/decisions/251-pattern-page.md`)

1. Routes: `/designs/[id]` editable, `?v=` read-only, `?clientId=` preselects on a new design.
2. Options live in the editor store with the spec (one dirty flag, one draft); the options panel stays a controlled component.
3. The preview uses the live measurement set, so client and server hash the same inputs; a version whose hash no longer matches without edits is `outdated`, not `saved`.
4. Stale preview = `result.inputHash !== inputHash(current inputs)`, computed in the main bundle with the engine's hash function (no geometry).
5. Save states are one pure function with a fixed order; Save is enabled only for `unsaved` and `outdated`.
6. 422 `PATTERN_INVALID` shows the server report in the report panel; `ApiError` keeps `details`.
7. A browser draft wins only when it was based on the current version.
8. Version data hooks live in `features/pattern-versions` (no cycle with the page).

### Risks

- Hash mismatch between client and server (different option defaults or measurement source) would make every save look `outdated`: both use `buildEngineOptions` from `@tafsila/schemas`; the e2e "reload shows Saved · version 1" catches it.
- Importing `inputHash` from `@tafsila/engine` must not pull geometry into the main chunk: #239's chunk guard runs in CI; if it trips, import from a dedicated `@tafsila/engine/hash` entry (add it to the engine's `exports`).
- Dependencies not merged in the shape assumed: names above are the contract; the build follows the merged code and edits this table in its PR.
- Engine bugs #229-#232 on offered combinations: preview shows the engine error (state `preview-error`); the e2e uses a combination not touched by them.

**Size:** L by scope (route, composition of five features, store additions, version hooks, save states, `ApiError` change, e2e). Proposed split (labels not changed):

- **#251a** page and preview: route, `PatternPageScreen`, layout, load current version, `preview-input`, `PreviewStatus`, `use-design`/`use-version`, move the #239 dev e2e; e2e up to "report reads pass or warn".
- **#251b** save version (new issue, depends on #251a and #245): `save-state`, `SaveVersionBar`, `use-save-version`, `save-error`, `ApiError.details`, leave warning, 422, e2e save and reload, test case file.
  Each half is size M. Without a split, keep one PR with two commits in that order.

**Build:** `build:sonnet` (unchanged; the plan fixes the hard parts). `needs-interactive`: no.

## Deviations

1. **Route.** The pattern page is `/designs/[id]/pattern` (as asked for the build), not `/designs/[id]`; `/designs/[id]` stays the section editor (#244/#246) and links to it with "View pattern" (`?clientId=` kept). `?v=<versionId>` read-only is left to #252.
2. **Stores.** Options and the base version live in a small page store (`features/pattern-page/hooks/use-page-store.ts`), not in the editor store, so the picker stays untouched. Dirty = spec dirty or options differ from their baseline.
3. **Stale preview without hashing.** `PreviewState` now carries `input`, the exact input object it answers; stale means `state.input !== currentInput`. No `@tafsila/engine` hash import in the main bundle, so no `./hash` entry was needed.
4. **Loading.** `GET /api/designs/:id` already returns `currentVersion` with all inputs, so no `useVersion` was needed; the client of a saved design comes from its measurement set (`useMeasurementSet`). The browser draft keeps #244's rule (used when made from the loaded spec); options are not drafted.
5. **Dev hosts.** `/dev/pattern-preview` and its e2e were removed (timing moved to `pattern-page.spec.ts`). `/dev/pattern-viewer` stays: the gesture and demo-report specs need a fixed dress and a demo failing check.
6. **Not built.** In-app leave guard on `AppNav` links (browser `beforeunload` warning only), a phone bottom sheet (the panel stacks under the viewer, as in the mobile picture), the `fail` e2e fixture (covered by unit and component tests), the "version history" link (#252). Visual checks are in the PR's `## Unticked criteria`.
