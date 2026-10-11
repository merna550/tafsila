---
packages: ["storybook", "@storybook/react-vite"]
level: intermediate
adr: ADR-031
---

# Storybook

**In one line:** A workshop page that shows every `packages/ui` component alone, in Arabic RTL and English LTR, at mobile and desktop widths.

## What it is (plain words)

Storybook renders each component from a small file next to it (`*.stories.tsx`) so you can see and click it without running the app. The toolbar has a Direction and a Width switch; the `globals=direction:ltr;width:desktop` URL parameter sets them for tests.

## Why we chose it

- Shows RTL and LTR for every component, as the frontend rules require.
- Its static build is our visual-snapshot source (Playwright) and a CI artefact.
- Free and open source; no hosted tool such as Chromatic (ADR-022).

## Alternatives we considered (and why not)

- **Chromatic:** hosted and paid beyond a free quota, against ADR-022.
- **Ladle / Histoire:** smaller but fewer features and addons.

## When we would change it

If Storybook builds get slow or break with a React/Vite major, move to Ladle; stories are plain CSF files and port easily.

## Where it lives in our code

- `packages/ui/.storybook/` (config, toolbar decorator), `packages/ui/src/*.stories.tsx`, visual spec `packages/ui/e2e/stories.spec.ts`.

## The 20% you need

- A story is an exported object with a `render`. Use `sampleFor(context)` for Arabic or English sample text.
- Add a story for every new component; the visual test picks it up from `index.json` automatically.

## Commands you'll use

`pnpm --filter @tafsila/ui storybook` (dev), `build-storybook`, `test:visual`, `test:visual:update`.

## Common mistakes

- Forgetting to update snapshots after an intended change (`test:visual:update`, then review the images).
- Hard-coding one language in a story.

## Learn more

- [Storybook docs](https://storybook.js.org/docs)
- Glossary: [Storybook](../glossary.md#storybook)
