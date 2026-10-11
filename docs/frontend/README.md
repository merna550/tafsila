# Frontend documentation (`apps/web`)

Kept current in the same PR as every UI change (Definition of Done). Architecture: `docs/ARCHITECTURE.md` §1. Agent notes: `apps/web/CLAUDE.md`.

## Design system

- `packages/ui`: shadcn/ui-based primitives, RTL-first, with tokens for colour, spacing and radius in `packages/ui/src/tokens.css` (the only file with raw colours). The brand is approved: values are generated from `docs/design-system/tokens.json` with `pnpm tokens` (ADR-80); read [the design system](../design-system/README.md). A fuller `docs/frontend/design-system.md` arrives with #70 and will link there.
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

## Page structure

```
src/app/[locale]/…/page.tsx   thin route: loads data (Server Component), renders a feature
src/features/<feature>/       components/ hooks/ <feature>.schema.ts index.ts
src/entities/                 shared domain views: Design, Client, PatternVersion
src/shared/                   api client, i18n, query client, workers, analytics
```

Import direction: `app → features → entities → shared → packages/*`. Another feature is imported only through its `index.ts`.

## State

| Kind                   | Tool                                                         |
| ---------------------- | ------------------------------------------------------------ |
| Server data            | TanStack Query hooks over the typed API client               |
| Local UI state         | React component state                                        |
| Pattern editor session | Zustand (selected piece, zoom, layers)                       |
| Pattern geometry       | `@tafsila/engine` in the browser; heavy work in a Web Worker |

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

## Testing

- Component tests: Vitest + Testing Library, next to the component.
- User flows: Playwright e2e (`pnpm test:e2e`) in `ar` and `en`, desktop and mobile widths.
- Manual cases: `docs/test-cases/ui/`.

## Tutorials and skills

| Task                        | Where                                   |
| --------------------------- | --------------------------------------- |
| New page or feature         | `.claude/skills/add-page/SKILL.md`      |
| New endpoint the page needs | `.claude/skills/add-endpoint/SKILL.md`  |
| Run the app locally         | `docs/backend/tutorials/run-locally.md` |
| Path-scoped agent rules     | `.claude/rules/frontend/`               |
