---
packages: ["vite", "@tailwindcss/vite"]
level: beginner
adr: ADR-031
---

# Vite

**In one line:** The fast build tool Storybook uses to bundle components, with the Tailwind plugin that generates our token classes.

## What it is (plain words)

Vite bundles and serves the code during development and builds the static Storybook. `@tailwindcss/vite` runs Tailwind v4 inside it. The web app itself still uses Next.js.

## Why we chose it

Storybook's React builder is Vite-based, and the Tailwind plugin is the official way to run Tailwind v4 there. `vite preview` also serves the static build for the visual tests.

## Alternatives we considered (and why not)

- **Webpack builder for Storybook:** slower, not the Storybook 9 default.

## When we would change it

If Storybook moves to another bundler, drop this card's packages with it.

## Where it lives in our code

- `packages/ui/.storybook/main.ts` (`viteFinal` adds the Tailwind plugin), `packages/ui/playwright.config.ts` (`vite preview`).

## The 20% you need

Vite is only used for tooling in `packages/ui`; production code never imports it.

## Commands you'll use

`pnpm --filter @tafsila/ui exec vite preview --outDir storybook-static`.

## Common mistakes

- Importing `vite` in app code.

## Learn more

- [Vite guide](https://vite.dev/guide/)
