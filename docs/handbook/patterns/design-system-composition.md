# Design-system composition

**One-line idea:** every screen is assembled from a small set of shared, token-styled components, so pages look and behave the same and a brand change touches one file.

## Plain words

Instead of styling each page, you pick ready parts (`Button`, `FormField`, `Card`, `EmptyState`) from `packages/ui`. The parts get their colours, sizes and spacing from named tokens, and show the same three states (loading, empty, error) everywhere.

## Why Tafsila uses it

Agents and people build pages in parallel; without shared parts each page drifts. Tokens come from `docs/design-system/tokens.json` (ADR-80), components from ADR-031 and ADR-033, error placement from ADR-030 and ADR-72.

## Where in our code

- Tokens: `docs/design-system/tokens.json` -> `pnpm tokens` -> `packages/ui/src/tokens.css`.
- Components and their stories: `packages/ui/src`.
- Usage guide with screenshots: [docs/frontend/design-system.md](../../frontend/design-system.md).
- Rules that enforce it: `.claude/rules/frontend/components.md` and `rtl-i18n.md`.

## Rules of thumb

- One primary button per screen; the rest are secondary or links.
- Repeated JSX twice means a new `packages/ui` component with a test and a story.
- Logical CSS only so one layout works in Arabic and English.
