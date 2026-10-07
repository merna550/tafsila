---
packages: []
level: intermediate
adr: ADR-011
---

# shadcn/ui

**In one line:** A set of accessible component recipes that we copy into `packages/ui` and own, instead of installing a UI library. Planned for M1.

## What it is (plain words)

shadcn/ui is not a package you depend on. Its command-line tool copies component source files (dialog, select, tabs...) into your repo. They are built on Radix primitives, which handle keyboard use and screen readers, and styled with [Tailwind](tailwind.md).

## Why we chose it

- **We own the code.** Components live in `packages/ui`, so we can change them for Arabic RTL, bigger touch targets or the Tafsila look without fighting a library.
- **Accessible by default.** Radix covers focus handling, ARIA roles and keyboard support, which we would otherwise have to write and test ourselves (target WCAG 2.2 AA, [glossary: WCAG](../glossary.md#wcag)).
- **Fits the rule "screens are built from `packages/ui`"** ([CODING_STANDARDS section 4](../../CODING_STANDARDS.md)).

## Alternatives we considered (and why not)

- **MUI / Chakra:** heavier, harder to restyle, and RTL quirks.
- **Writing every component from scratch:** slow and error-prone for accessibility.

## When we would change it

Not installed yet (only the hand-written `Button` exists). If copied components drift from upstream fixes too much, we can adopt Radix directly. Because we own the files, nothing forces a change.

## Where it lives in our code

- `packages/ui/src/` is where copied components will go; today `packages/ui/src/button.tsx` shows the style they must follow.
- Design-system rules: [frontend docs](../../frontend/README.md).

## The 20% you need

- Copied components must pass our own standards: JSDoc on each, logical classes (`ms-*`), strings through props, never hard-coded text.
- Add a component with the shadcn CLI, then adapt it and add a test beside it, as `button.test.tsx` does.

## Commands you'll use

Planned: `pnpm dlx shadcn@latest add <component>` run inside `packages/ui`.

## Common mistakes

- Copying a component and leaving physical (`left/right`) classes in it.
- Editing a component in `apps/web` instead of `packages/ui`.

## Learn more

- [shadcn/ui docs](https://ui.shadcn.com/docs) (official), [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction)
- Glossary: [shadcn/ui](../glossary.md#shadcn)
