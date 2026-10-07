---
name: add-page
description: Add a new page or feature screen to apps/web (route, feature folder, ar/en messages, tests, test cases). Use when an issue asks for a new screen, route or user-facing feature in the web app.
---

# Add a page or feature to apps/web

Read `apps/web/CLAUDE.md` and `docs/frontend/README.md` first.

1. **Contract:** if the screen shows or sends new data, add or extend the Zod schema in `packages/schemas`. If a new endpoint is needed, run the `add-endpoint` skill first.
2. **Feature folder:** create `apps/web/src/features/<feature>/`:
   - `components/`: presentational components with typed props, no fetching
   - `hooks/`: TanStack Query hooks that use the typed API client
   - `index.ts`: the only public export of the feature
3. **Route:** add a thin page under `apps/web/src/app/` that composes the feature and holds no logic. It stays a Server Component unless it is an interactive tool.
4. **UI:** build from `packages/ui`. Add a new shared primitive there, with a test, rather than styling inside the feature.
5. **Messages:** add every string to both `messages/ar.json` and `messages/en.json`. Use logical CSS only.
6. **Tests:**
   - Component tests next to the components.
   - A Playwright e2e test for the main flow, run in `ar` and `en`.
   - Screenshots for the PR.
7. **Manual test cases:** copy `docs/test-cases/_TEMPLATE.md` to `docs/test-cases/ui/<N>-<slug>.md`. Cover:
   - happy path, errors and permissions
   - RTL and mobile
     Then run `scripts/test-case-index.sh`.
8. **Definition of Done:** complete every item in `docs/WORKFLOW.md` §5. Run `pnpm quality && pnpm test && pnpm test:e2e`.
