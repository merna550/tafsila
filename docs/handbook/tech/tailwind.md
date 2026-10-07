---
packages: [tailwindcss, "@tailwindcss/postcss"]
level: beginner
adr: ADR-011
---

# Tailwind CSS

**In one line:** Styling with small utility classes, using logical properties so Arabic right-to-left layouts work without a second stylesheet.

## What it is (plain words)

Instead of writing CSS files with names, you put short classes straight on the element: `rounded-lg px-5 text-base`. Tailwind scans the code and generates only the CSS that is used.

## Why we chose it

- **Logical properties make RTL free.** Classes such as `ms-*` (margin start), `me-*`, `ps-*`, `pe-*` and `text-start` follow the reading direction, so an Arabic page and an English page share the same markup with no mirrored CSS ([glossary: CSS logical properties](../glossary.md#css-logical), `.claude/rules/frontend/rtl-i18n.md`).
- **Design tokens in one place.** Colours and fonts live in `apps/web/src/app/globals.css`; changing the brand colour is one edit.
- **No naming debates.** Nobody invents `.card-header-inner`; agents produce consistent styling.
- **Small output.** Only used classes ship, helpful on mobile data.

## Alternatives we considered (and why not)

- **CSS Modules:** fine, but every component needs a hand-named stylesheet and RTL needs manual care.
- **styled-components / CSS-in-JS:** runtime cost and a weaker story with Server Components and RTL.

## When we would change it

If Tailwind's build tooling lags behind Next.js again, or the design needs a heavy theming system. Components in `packages/ui` hide class names, so a swap touches that package only.

## Where it lives in our code

- `apps/web/src/app/globals.css` (`@import "tailwindcss"`, tokens, `@source` pointing at `packages/ui/src`).
- `apps/web/postcss.config.mjs` (the `@tailwindcss/postcss` plugin).
- `packages/ui/src/button.tsx` (variants as class maps).

## The 20% you need

- Layout: `flex`, `grid`, `gap-4`. Spacing: `p-4` (all sides), `px-5` (horizontal). Colour: `bg-rose-700 text-white`.
- Always prefer logical classes in anything direction-sensitive (`ms-2`, not `ml-2`).
- Variants such as `hover:` and `disabled:` are prefixes:

```ts
// packages/ui/src/button.tsx
primary: "bg-rose-700 text-white hover:bg-rose-800",
```

## Commands you'll use

`pnpm dev` (live reload). There is no separate CSS build command.

## Common mistakes

- Using `ml-*`/`mr-*`/`left-*` and breaking RTL.
- Building class names from string pieces (`"bg-" + color`): Tailwind cannot see them. Write complete class names.
- New UI package not listed in `@source`, so its classes are missing.

## Learn more

- [Tailwind CSS docs](https://tailwindcss.com/docs) (official), and the [logical properties guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)
- Glossary: [Tailwind](../glossary.md#tailwind), [RTL](../glossary.md#rtl), [design system](../glossary.md#design-system)
