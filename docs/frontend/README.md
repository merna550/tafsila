# Frontend documentation (`apps/web`)

Kept current in the same PR as every UI change (Definition of Done). Architecture: `docs/ARCHITECTURE.md` §1. Agent notes: `apps/web/CLAUDE.md`.

## Design system

- `packages/ui`: shadcn/ui-based primitives, RTL-first, with tokens for colour, spacing and radius in `packages/ui/src/tokens.css` (the only file with raw colours). The brand is approved: values are generated from `docs/design-system/tokens.json` with `pnpm tokens` (ADR-80); read [the design system](../design-system/README.md) (the brand) and [Using the design system](design-system.md) (which component for what, forms, page structure, states, RTL).
- Features compose primitives and never restyle them ad hoc. JSX repeated twice is promoted to `packages/ui` with a test.
- Every component has a JSDoc purpose comment and typed props (`docs/CODING_STANDARDS.md` §4–5).

## RTL and i18n

| Rule                                                                           | Why                                       |
| ------------------------------------------------------------------------------ | ----------------------------------------- |
| Arabic (`ar`, RTL) is the default locale; English (`en`) is second (next-intl) | Egypt first                               |
| All strings in `messages/{ar,en}.json`                                         | No hard-coded text; translations reviewed |
| Logical CSS only: `ms/me/ps/pe`, `start/end`                                   | One layout works in both directions       |
| Directional icons flip in RTL                                                  | Arrows point the reading direction        |
| Western digits by default, Arabic-Indic as a setting (NFR-06)                  | Measurements stay readable                |

### How i18n works (next-intl, issue #90)

- **URLs:** Arabic has no prefix (`/`, `/sign-in`), English lives under `/en` (`/en/sign-in`). `src/proxy.ts` negotiates the locale; `shared/i18n/routing.ts` is the single definition (decision 25a-2).
- **Texts:** `messages/ar.json` and `messages/en.json`, grouped by feature (`home`, `errors`, `common`). A test fails when a key exists in only one file; `global.d.ts` types the keys, so `t("typo")` does not compile.
- **Use them:** in a component `const t = useTranslations("home")`; in an async server component `await getTranslations("home")`. Never write text or `aria-label`/`placeholder`/`title`/`alt` literals in JSX (ESLint fails).
- **Links and redirects:** import `Link`, `redirect`, `usePathname`, `useRouter` from `shared/i18n`, not from `next/link` or `next/navigation`, so the prefix is kept. `LocaleSwitch` (in the app header) opens the same page in the other language.
- **Direction:** `app/[locale]/layout.tsx` sets `lang` and `dir` on `<html>`; `DIRECTION` in `shared/i18n/routing.ts` maps locale to direction.
- **Tests:** unit tests render with `renderWithIntl(element, "ar" | "en")` from `shared/i18n/testing`. Flows run in Playwright (`pnpm --filter web test:e2e`) in both languages at mobile and desktop width.

## Page structure

```
src/app/[locale]/…/page.tsx   thin route: loads data (Server Component), renders a feature
src/features/<feature>/       components/ hooks/ <feature>.schema.ts index.ts
src/entities/                 shared domain views: Design, Client, PatternVersion
src/shared/                   api client, i18n, query client, workers, analytics
```

Import direction: `app → features → entities → shared → packages/*`. Another feature is imported only through its `index.ts`.

**Option drawings:** `src/features/design-picker/illustrations/` holds the picker line drawings as SVG path data per feature (`OptionIllustration path value`). To replace one, edit its entry in the matching file; review at `/dev/option-illustrations`.

## State

| Kind                   | Tool                                                         |
| ---------------------- | ------------------------------------------------------------ |
| Server data            | TanStack Query hooks over the typed API client               |
| Local UI state         | React component state                                        |
| Pattern editor session | Zustand (selected piece, zoom, layers)                       |
| Pattern geometry       | `@tafsila/engine` in the browser; heavy work in a Web Worker |

### Server data with TanStack Query (first used in #30)

- `QueryProvider` (`shared/query/`) wraps the app: 30 s `staleTime`, reads retry only retryable errors, writes never retry.
- Keys live in `features/<f>/hooks/query-keys.ts`: `["clients", { q, limit }]` list, `["clients", id]` one, `["measurement-sets", { clientId }]` sets. A mutation invalidates the prefix `["clients"]`.
- Hook shapes: `use-<things>` (list, `useInfiniteQuery` with `limit`/`offset` and `keepPreviousData` while searching), `use-<thing>` (one), `use-create|update|delete-<thing>` (mutations). Components never import them; the feature-root screen (`ClientsScreen`) calls the hooks and passes props down.
- Forms: `use-client-form` wires React Hook Form + a Zod schema whose messages are keys of `messages/`, maps `ApiError.fieldErrors` with `setError`, and toasts on success.
- `AppNav` (`shared/layout/`) is the signed-in bar rendered by `(dashboard)/layout.tsx`; items are the typed `NAV_ITEMS` list.

**Where the phone screen sits (#26):** `features/verify-phone` (number step, code step, dashboard banner). The `CodeInput` in `packages/ui` is a controlled row of single-digit boxes: always `dir="ltr"`, first box has `autocomplete="one-time-code"`, paste or autofill fills all boxes, Arabic-Indic digits are converted. Its hooks load data with `apiRequest` and plain state (`use-phone-status`, `useApiAction`) because they were written before TanStack Query arrived with #30; they can move to Query hooks like the clients feature.

## Layers

Per feature: `components/` (UI, props in → JSX out) → `hooks/` (TanStack Query, forms, Zustand) → `model/` (pure TypeScript) → `shared/api` (the only `fetch`). The browser never talks to the database; Supabase exists only in `shared/auth/` for the session. Full rules with examples: `.claude/rules/frontend/layering.md`; enforced by dependency-cruiser (ADR-029).

## Error display

`shared/api` turns every failure into one `ApiError`; `placementFor(error, context)` decides where it is shown:

| Case                             | Shown as                                        |
| -------------------------------- | ----------------------------------------------- |
| Field validation (`fieldErrors`) | text under the field (FormField)                |
| Failed action                    | toast                                           |
| Page data failed to load         | ErrorState in the page with "Try again"         |
| 401                              | redirect to sign-in, then back to the same page |
| 403                              | clear "no permission" message                   |
| Offline / network                | fixed connection banner                         |
| Unknown / 5xx                    | generic Arabic message + copyable reference     |

In code: `routeError(error, context)` gives the place, the Arabic message and the copyable reference; `useApiErrorHandler()` shows toasts and redirects (401 goes to `/sign-in?next=<same page>`); `ConnectionBanner` is in the `AppShell` banner slot; `AppErrorBoundary` wraps the app and reports to Sentry with the request id; `DataState` (`shared/data-state`) is the loading / empty / error pattern for every data screen (ADR-72).

The error catalogue is [docs/errors.md](../errors.md) (ADR-030).

## Engine in a worker

The pattern preview drafts in a Web Worker (`src/shared/pattern-preview/`, issue #239) so the page never freezes (FR-PAT-04).

- Call `usePatternPreview(input)` with a memoised `{ spec, measurements, options? }` or `null`. It returns `{ status: idle | running | done | error, result, error, durationMs, inputHash }`. Input changes are debounced by `PATTERN_PREVIEW_DEBOUNCE_MS` (250 ms); the last input wins and older answers are dropped.
- `inputHash` is `result.meta.createdFrom`, the same hash the server stores, so the page can tell when the preview equals the saved version.
- An error state carries a code; `previewErrorToApiError` turns it into an `ApiError` for the shared error display. An engine crash is shown as an unexpected error, never thrown in render.
- Only the worker imports the engine geometry. Pages import `@tafsila/engine/measurements` for validation and `@tafsila/engine/spec-rules` for the picker rules. `scripts/check-engine-chunk.mjs` runs after `next build` in the e2e job and fails when a page bundle loads engine code.
- The pattern page (#251) is the real host of the preview; the `/dev/pattern-preview` route and its probe were removed. A state carries `input`, the exact input object it answers, so the page can tell a stale draft without hashing in the main bundle.

## Design picker and editor store

`features/design-picker/` (issue #244) owns `/designs/new` (category step, creates the design) and `/designs/[id]` (frame: section list, open section, reset notice). The editor store (`hooks/use-editor-store.ts`, Zustand) holds the spec being edited, the baseline, one undo level and the reset notice; the pure steps are in `model/editor-state.ts`. A draft is kept in `localStorage` under `tafsila.editor-draft.<designId>` through `shared/storage/safe-storage.ts` and is used only when it was made from the loaded spec. Sections come from `sectionsFor(specOptions(spec))`. Import the rules only from `@tafsila/engine/spec-rules`; it must not reach the geometry kit.

## Pattern viewer

`src/features/pattern-viewer/` (issue #243) draws a `PatternScene` (built by the engine in the preview worker: `usePatternPreview(...).scene`) with zoom, pan and fit.

- **Controlled model.** The page owns one `useViewerState()` and passes `layers`, `selectedPieceId`/`onSelectPiece`, `highlight`, `measure`/`onMeasureChange` to `PatternViewer`, and other pieces of it to the piece panel and the validation report. Zoom and pan stay inside the viewer; call `ref.current.fit()` or `.zoomTo(targets)` from outside. `resolveRef(scene, ref)` (from `@tafsila/engine/viewer`) turns a validation `refs` string into a `ViewerTarget`.
- **No mirroring.** The canvas is `dir="ltr"`; only the buttons follow the locale. Arrow keys move the content in the arrow's physical direction.
- **Gestures.** Pointer Events only (mouse, touch, pen); wheel zooms at the cursor; two pointers pinch; `touch-action: none`. The maths is in `model/viewport.ts` (pure, unit-tested); real gestures are tested in Playwright (`pattern-viewer.spec.ts`, and `pattern-viewer-touch.spec.ts` in the `mobile-360` project).
- **Drawing.** Each piece is a `<g data-piece-id>`; each edge a `<path data-edge-id>`; selected and highlighted ones carry `data-selected` / `data-highlighted`. Colours come from tokens. Lines use `non-scaling-stroke`.
- **Layers and piece details (#248).** `LayerToggles` (five checkboxes), `PieceList` (a button per piece for keyboard and screen readers) and `PiecePanel` (name, cut text, size, edge lengths and seam allowances of the selected scene piece) are views over `ViewerController`; values come from the scene via `pieceDetails`, no maths in the UI.
- **Validation report (#249).** `ValidationReport` lists the engine's checks (failures, warnings, passes collapsed; icon + status word + message + values in cm). It only calls `onSelect(key, targets)`; the page sets `highlight` and calls `zoomTo` (see `ViewerDevHost`). `reportRows` (pure) resolves refs with `resolveRef` and returns `FR-MEAS-01` checks as `formLevel` for the form to show.
- **Measure tool (#253).** The toolbar button (`aria-pressed`) sets `measure.active`; a tap within 16 px of a snap point (stitch corners and notches) picks it, the second pick shows the line and the distance from the engine `measureBetween` in cm (`MeasureReadout`, `aria-live`). A third tap restarts; Escape leaves the tool. Keyboard and screen readers pick the two points in `MeasurePointList` (two selects). Logic is in `model/measure.ts`.
- Layers persist per viewer in `localStorage` (`tafsila.viewer.layers`), nothing else does.
- `/dev/pattern-viewer` stays as the host of the gesture and demo-report specs (they need a fixed seed dress and a demo failing check, which the real page cannot produce); the real page is covered by `e2e/pattern-page.spec.ts`.

## Pattern page

`features/pattern-page/` (issue #251) owns `/designs/[id]/pattern`; `/designs/[id]` stays the section editor and links to it (`PatternLink`). Data flows one way:

```
editor store (spec)  +  page store (options, base version)        <- sections / options panel
   -> buildPreviewInput(spec, options, set, client)                  live measurement set
   -> usePatternPreview(input)  (worker)  -> { scene, result, input }
   -> PatternViewer, piece panel, ValidationReport read the result
   -> saveStateOf(...) (pure) -> SaveVersionBar -> useSaveVersion -> POST /api/designs/:id/versions
```

Version history (issue #252): `/designs/[id]/versions` lists the versions (hooks in `features/pattern-versions`, screens in `features/pattern-page`); `/designs/[id]/versions/[versionId]` draws an old version read only from its stored inputs in the same worker, and restore (`useRestoreAction`) asks, calls `POST /api/versions/:id/restore`, then replaces the stores of the loaded design. The running engine version comes from `@tafsila/engine/version`.

Save states (`model/save-state.ts`, first match wins; Save is enabled only for `unsaved` and `outdated`):

| kind              | when                                                                | Save                          |
| ----------------- | ------------------------------------------------------------------- | ----------------------------- |
| `loading`         | design or measurement set loading                                   | hidden                        |
| `no-set`          | no measurement set chosen                                           | off, "choose measurements"    |
| `previewing`      | worker idle or running, or its answer is for older inputs           | off                           |
| `preview-error`   | the worker failed on the current inputs                             | off, shared error display     |
| `server-rejected` | the server answered 422 for these same inputs                       | off, server report shown      |
| `fail`            | report status `fail`                                                | off, "fix the problems first" |
| `saving`          | request running                                                     | off                           |
| `saved`           | preview hash equals the base version's `inputHash`                  | off, "Saved"                  |
| `outdated`        | nothing edited, but the hash differs (set edited or engine changed) | on                            |
| `unsaved`         | otherwise                                                           | on                            |

A refused save (422 `PATTERN_INVALID`) keeps `ApiError.report` and shows it in the report panel, not a toast. Options live in the page store (kept while you move between the editor and the pattern page); the spec stays in the editor store.

## Export

`shared/pattern-export/` (issue #289, [ADR-289](../decisions/289-export-worker.md)) is the export worker and its client; `features/pattern-export/` is the dialog. The worker is separate from the preview worker, drafts the version again from its stored inputs and builds the file with `@tafsila/export` (`buildA4Pdf`, `buildA0Pdf`) or `renderPrintSheet` (SVG).

- Protocol (`protocol.ts`): `ExportRequest { id, kind: "a4" | "a0" | "svg", input, meta }`; answers are `{ id, progress }` and a final `ExportResult` (`bytes` transferred, `mime`, `pageCount` or null). `export-handler.ts` is pure (`runExport(request, { loadFonts }, onProgress)`) and has a `BUILDERS` table by kind.
- `createExportClient` keeps the latest request, resolves the older as stale and recreates the worker on `cancel()`. `usePatternExport()` wraps it: `{ state, start, cancel, reset, downloadAgain }`; the state is `idle | running | done | error` (`export-state.ts`). On success it downloads the file (`download.ts`) and sends `pattern_exported` (`kind`, `pages`).
- Fonts are fetched by the worker from `/fonts/`; errors are `FONT_LOAD_FAILED`, `PDF_BUILD_FAILED`, `WORKER_FAILED` or `PATTERN_INVALID` ([errors](../errors.md)). File names come from `exportFileName`.
- The dialog (`ExportDialog`, `ExportDialogBody`, option list, instructions, progress) follows `docs/design/screens/ExportDialog.dc.html`. `UseVersionBar` has an `actions` slot; `VersionExportButton` fills it on the version view.
- Bundle rule: `scripts/check-engine-chunk.mjs` checks the marker groups `engine` and `pdf` after `next build`; dependency-cruiser allows `@tafsila/export` only in the worker, the handler and the protocol types, and forbids `pdf-lib` in `apps/web/src`.

## Projector

`features/projector/` (issue #285, [ADR-285](../decisions/285-projector-calibration.md)) owns the projector pages under `(projector)/designs/[id]/versions/[versionId]/projector/`, outside the dashboard chrome. `model/calibration.ts` is the pure maths (`calibrationFrom`: CSS px per real mm on X and Y from the measured sides of a square drawn in CSS px); `model/calibration-store.ts` reads and writes `tafsila.projector.calibration` through `shared/storage` and answers `missing`, `stale` (screen size or pixel ratio changed) or `ok`; `useCalibration()` reads it after mount. `ProjectorScreen` (#286, [ADR-286](../decisions/286-projector-view.md)) draws the version's `PatternScene` from the preview worker in one SVG: `model/projector-view.ts` (mm to px per axis, `patternTransform`, `verificationSquare`, pan), `model/keymap.ts` (keys by `event.code`, `HELP_ROWS`), `model/placement.ts` (pure placement: offset plus `0 | 180`, #287, [ADR-287](../decisions/287-projector-pieces.md)), `ProjectorCanvas` (pure SVG, square outside the mirrored group), `ProjectorToolbar`, `KeyboardHelp`; line width and colour persist in `tafsila.projector.view`. `PieceSwitcher` and `PlacementControls` list pieces and turn/reset them; arrow keys move the active piece or pan, placements persist in `tafsila.projector.placement.<versionId>`; in e2e, `seedCalibration` (`e2e/support/projector.ts`) stores a valid entry for the page's own screen.

## Direct cut

`features/direct-cut/` (issue #291, [ADR-291](../decisions/291-direct-cut-ui.md)) is the checklist at `/designs/[id]/versions/[versionId]/cut`, opened by `DirectCutLink` in the `actions` slot of `UseVersionBar`. The preview worker has a second message type, `{ kind: "cut-steps", id, spec, measurements, options?, curveStepMm }`, answered with `{ kind: "cut-steps", ok: true, plan: CutPlan }` or `{ ok: false, error }`; `shared/pattern-preview/cut-plan.ts` is the only file that knows the engine's `CutSteps` and fills the `CutPlan` (types in `cut-plan-types.ts`). `useCutSteps` runs it in its own worker. Ticks: `tafsila.cut.ticks.<versionId>.<curveStepMm>` = `{ v: 1, engineVersion, ticked }`, ignored when the engine version differs; setting: `tafsila.cut.settings` = `{ curveStepMm: 20 | 25 | 30 }`. `PrintSheet` is the same page in print (`print:` variants) or in the on-screen "Print view" state; it never reads ticks.

The drawing highlights the current step (issue #292, [ADR-292](../decisions/292-step-diagram.md)): `useCurrentStep` keeps the tapped step id (tap or focus on a row), the current step is that or the first unticked one, and ticking clears the tap. `PieceDiagram` takes `highlight` (`model/steps.ts`): those points are big (`data-current`), the others dimmed (`data-dimmed`), and each guide is a dashed segment with its cm length. The adapter fills `guides` and `group` on each step; the print sheet draws one small diagram per group. The drawing is `dir="ltr"` and never mirrors.

## Testing

- Component tests: Vitest + Testing Library, next to the component.
- User flows: Playwright e2e (`pnpm test:e2e`) in `ar` and `en`, desktop and mobile widths.
- Manual cases: `docs/test-cases/ui/`.

## Tutorials and skills

| Task                        | Where                                                                             |
| --------------------------- | --------------------------------------------------------------------------------- |
| New page or feature         | `.claude/skills/add-page/SKILL.md` (start with `pnpm gen feature <name> <issue>`) |
| New endpoint the page needs | `.claude/skills/add-endpoint/SKILL.md`                                            |
| Run the app locally         | `docs/backend/tutorials/run-locally.md`                                           |
| New garment feature         | `.claude/skills/add-garment-module/SKILL.md`                                      |
| Path-scoped agent rules     | `.claude/rules/frontend/`                                                         |

## Decisions

| Topic                                                                  | Where                                                   |
| ---------------------------------------------------------------------- | ------------------------------------------------------- |
| Frontend layers and rules v2 (ADR-029), error contract (ADR-030)       | [DECISIONS.md](../DECISIONS.md) (ADR-029, ADR-030)      |
| Design system base: tokens file, Radix, Storybook, snapshots (ADR-031) | [DECISIONS.md](../DECISIONS.md) (ADR-031)               |
| Layout, overlay and feedback components (ADR-033)                      | [DECISIONS.md](../DECISIONS.md) (ADR-033)               |
| Error display, `DataState`, connection banner (ADR-72)                 | [72-error-display.md](../decisions/72-error-display.md) |
| Brand applied, generated tokens (ADR-80)                               | [80-brand-tokens.md](../decisions/80-brand-tokens.md)   |
| Data access behind the API (ADR-035)                                   | [DECISIONS.md](../DECISIONS.md) (ADR-035)               |

Rules v2: [components](../../.claude/rules/frontend/components.md) · [layering](../../.claude/rules/frontend/layering.md) · [error display](../../.claude/rules/frontend/error-display.md) · [RTL and i18n](../../.claude/rules/frontend/rtl-i18n.md) · [state and forms](../../.claude/rules/frontend/state-and-forms.md). Components and their screenshots: [design-system.md](design-system.md); error catalogue: [errors.md](../errors.md).

## Settings feature (`features/settings`)

`/settings` has three cards (account, display, delete account) and a sign-out link. The language toggle calls `router.replace(pathname, { locale })` and saves `locale` to the profile in the background (`useSwitchLanguage`); the URL and the `NEXT_LOCALE` cookie make the choice stick on this device. Account deletion (`useDeleteAccount`) calls `DELETE /api/account`, clears the local session (`clearLocalSession` in `shared/auth`) and opens the home page with `?account=deleted`, where `AccountDeletedNotice` shows a toast once.

## Fabric feature (`features/fabric`)

The "Recommended fabrics" section of the saved-version page (`/designs/[id]/versions/[versionId]`, issue #319, FR-REC-02). `FabricRecommendations({ versionId })` is the only export: it calls `useFabricRecommendations` (TanStack Query over `GET /api/fabrics/recommend`, 5-minute `staleTime`) and shows loading, empty and error through `DataState`. `components/` holds the cards (`FabricCard`, `PropertyMeter`, `AvoidList`) and `model/` the pure helpers (`pickLocalized`, `propertyRows`). The response carries each fabric's names and properties, so no second request is needed ([decision 319](../decisions/319-fabric-recommend-ui.md)). The yardage calculator (#318) joins this feature.
