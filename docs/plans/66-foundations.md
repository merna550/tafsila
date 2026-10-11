# Plan 66: foundations (design system, frontend layers, error contract, rules v2)

The issue is the plan (`plan:none`). This file records the order of work, library choices and ADRs.

## Order of work (3 PRs, each `pnpm quality && pnpm test` green)

| PR  | Content                                                                                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Rules v2 (`.claude/rules/{frontend,backend,engine}`, CODING_STANDARDS), CI enforcement (dependency-cruiser layer rules, ESLint rules for tokens, logical direction, JSX strings), error contract (catalogue, `docs/errors.md`, catalogue test, `apps/web/src/shared/api` client with typed `ApiError`) |
| 2   | `packages/ui/src/tokens.css`, base components with tests, error display components (ErrorState, toast, connection banner), Storybook (RTL + LTR), visual snapshots                                                                                                                                     |
| 3   | `docs/frontend/design-system.md`, `add-page` / `add-endpoint` / `add-garment-module` skills, handbook pattern pages                                                                                                                                                                                    |

## Choices

- **Layer enforcement:** dependency-cruiser (already in CI), no new tool.
- **Token / direction / string rules:** ESLint `no-restricted-syntax` and `no-restricted-imports`, no new plugin. Scoped by file glob so only `packages/ui/src/tokens.css` may hold raw colours.
- **Error catalogue:** one `ERROR_CATALOGUE` map in `packages/api/src/domain/errors.ts`; `AppError` subclasses take their messages from it; a test walks the source for `code` strings and checks the catalogue and `docs/errors.md`.
- **API client:** plain `fetch` wrapper in `apps/web/src/shared/api` (Hono RPC types can be added when routes with typed bodies exist; M1 wave 1 adds the first ones). It is the only place that calls `fetch`.
- **UI kit:** shadcn/ui-style components written in `packages/ui` on Radix primitives; Storybook 9 with the Vite builder (`@storybook/react-vite`). Both are free and open source; no paid service (visual snapshots stay in the repo, not in a hosted tool).
- **Brand:** placeholder palette and font stack, marked `PLACEHOLDER` in `tokens.css`; Merna picks the brand later by editing that file only.

## ADRs

- ADR-029 Frontend layering and enforced rules v2
- ADR-030 Error contract (backend to frontend)
- ADR-031 Design system (tokens, base components, Storybook)
