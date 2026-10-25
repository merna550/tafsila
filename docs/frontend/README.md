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
- `/dev/pattern-preview?design=seedDress` hosts the browser test until the pattern page (#251) exists.

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
- Layers persist per viewer in `localStorage` (`tafsila.viewer.layers`), nothing else does.
- `/dev/pattern-viewer` hosts the browser tests until the pattern page (#251) exists.

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
