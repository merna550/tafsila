# Plan #80: Apply the approved brand to design tokens and components

The issue body is the plan (`plan:none`). Summary of what was built: see [ADR-80](../decisions/80-brand-tokens.md).

1. Brand source `docs/design-system/` (tokens.json + README.md).
2. `scripts/gen-tokens.mjs` generates the brand part of `packages/ui/src/tokens.css`; `pnpm tokens`, `pnpm tokens:check` (in CI).
3. Outlined secondary button, brand shadows, badge in caption size, IBM Plex Sans Arabic (next/font in web, fontsource in Storybook).
4. Contrast test and generator tests; visual snapshots regenerated.
