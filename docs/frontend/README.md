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

| Task                        | Where                                        |
| --------------------------- | -------------------------------------------- |
| New page or feature         | `.claude/skills/add-page/SKILL.md`           |
| New endpoint the page needs | `.claude/skills/add-endpoint/SKILL.md`       |
| Run the app locally         | `docs/backend/tutorials/run-locally.md`      |
| New garment feature         | `.claude/skills/add-garment-module/SKILL.md` |
| Path-scoped agent rules     | `.claude/rules/frontend/`                    |

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
