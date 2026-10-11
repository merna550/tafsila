# Plan 72: error display (foundations 2c/4)

The issue is the plan (`plan:none`). Part of #66; follows #69 (components).

## Order of work

1. `shared/error-display`: `routeError`, `signInUrl`, texts, `ApiErrorView` (copyable request id), `ConnectionBanner`, `AppErrorBoundary`, `useApiErrorHandler`.
2. `shared/data-state`: `DataState` (Skeleton / EmptyState / ErrorState).
3. Wire `AppFrame` (toasts, AppShell with banner, boundary) into the root layout; `reportError` in the monitoring wrapper.

## Choices

- Texts live in a typed module until next-intl is installed (ADR-72, [decision](../decisions/72-error-display.md)).
- Web vitest uses the oxc automatic JSX runtime so component tests render with `renderToStaticMarkup` (no DOM).
- The home page's `<main>` became a `<div>` because `AppShell` now provides `<main>`.

## Out of scope

Sign-in page (M1); design-system docs and skills (#70).
