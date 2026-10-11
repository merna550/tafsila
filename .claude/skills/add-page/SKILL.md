---
name: add-page
description: Add a new page or feature screen to apps/web (route, feature folder, ar/en messages, tests, test cases). Use when an issue asks for a new screen, route or user-facing feature in the web app.
---

# Add a page or feature to apps/web

Read `apps/web/CLAUDE.md`, `docs/frontend/README.md` and `docs/frontend/design-system.md` first. The rules in `.claude/rules/frontend/` (rules v2) are enforced by ESLint and dependency-cruiser.

1. **Contract:** if the screen shows or sends new data, add or extend the Zod schema in `packages/schemas`. If a new endpoint is needed, run the `add-endpoint` skill first.
2. **Feature folder (four layers, ADR-029):** create `apps/web/src/features/<feature>/`:
   - `components/` (UI): props in, JSX out, no fetching, no TanStack Query
   - `hooks/` (application): TanStack Query hooks over the typed API client in `shared/api`, React Hook Form + Zod, Zustand only for the pattern editor
   - `model/` (domain): pure TypeScript view-models, mappers and formatting, no React
   - `index.ts`: the only public export of the feature
3. **Route:** add a thin page under `apps/web/src/app/[locale]/` that composes the feature through its `index.ts` and holds no logic. It stays a Server Component unless it is an interactive tool.
4. **UI:** build from `packages/ui` (`PageHeader`, `Card`, `FormField` + `Input`, `Button`, `Table`, `Dialog`, ...); the table in `docs/frontend/design-system.md` says which component for what. One `primary` button per screen. Style with tokens only (no hex, `bg-[...]`, Tailwind palette). Add a new shared component there, with a test and a story, rather than styling inside the feature.
5. **States and errors (ADR-030, ADR-72):** show loading (`Skeleton`), empty (`EmptyState` with a next action) and error (`ErrorState` with retry) through `DataState`. Field errors from `ApiError.fieldErrors` go under the field with `setError`; failed actions show a toast via `useApiErrorHandler()`. Never read raw responses or show a status number; new error codes are added to the catalogue (`docs/errors.md`).
6. **Messages:** add every string to both `messages/ar.json` and `messages/en.json`; JSX holds no literal text. Use logical CSS only (`ms-*`, `pe-*`, `text-start`); flip directional icons.
7. **Tests:**
   - Component tests next to the components.
   - A Playwright e2e test for the main flow, run in `ar` and `en`.
   - Screenshots for the PR.
8. **Manual test cases:** copy `docs/test-cases/_TEMPLATE.md` to `docs/test-cases/ui/<N>-<slug>.md`. Cover:
   - happy path, errors and permissions
   - RTL and mobile
     Then run `scripts/test-case-index.sh`.
9. **Definition of Done:** complete every item in `docs/WORKFLOW.md` §5. Run `pnpm quality && pnpm test && pnpm test:e2e`.
