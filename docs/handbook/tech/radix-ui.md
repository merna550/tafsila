---
packages:
  [
    "@radix-ui/react-checkbox",
    "@radix-ui/react-label",
    "@radix-ui/react-radio-group",
    "@radix-ui/react-select",
    "@radix-ui/react-slot",
    "@radix-ui/react-switch",
  ]
level: intermediate
adr: ADR-031
---

# Radix UI primitives

**In one line:** Unstyled, accessible building blocks (checkbox, select, switch...) that `packages/ui` styles with our tokens.

## What it is (plain words)

Radix gives each control its keyboard handling, focus management and ARIA roles, with no styling. We add the look with Tailwind token classes. `Slot` lets a component hand its styles to the child element (for example a Next.js link).

## Why we chose it

- Accessibility we would otherwise write and test by hand (arrow keys in radio groups, typeahead in selects, `aria-checked`).
- Direction aware: `dir="rtl"` flips menus and arrow keys.
- Free and open source (ADR-022); it is what shadcn/ui is built on ([shadcn/ui card](shadcn-ui.md)).

## Alternatives we considered (and why not)

- **Native `<select>` / checkbox:** cannot be themed consistently and the open list is not styleable.
- **MUI / Chakra:** heavy, harder to restyle with our tokens.

## When we would change it

If Radix drops React support or a primitive cannot meet an accessibility need, replace that one component; screens only import from `packages/ui`.

## Where it lives in our code

- `packages/ui/src/{checkbox,radio,select,switch,form-field,link}.tsx`.

## The 20% you need

- Radix sets `aria-checked` / `data-state`; we style with the `aria-checked:` variant.
- Pass `dir` to `Select` and `RadioGroup` so keyboard and menus follow the page direction.
- `FormField` gives the control `id`, `aria-describedby` and `aria-invalid`.

## Commands you'll use

`pnpm --filter @tafsila/ui test`.

## Common mistakes

- Putting literal text in a component; text comes from props.
- Forgetting `dir` on a `Select` rendered in Arabic.

## Learn more

- [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction)
- Glossary: [Radix UI](../glossary.md#radix-ui)
