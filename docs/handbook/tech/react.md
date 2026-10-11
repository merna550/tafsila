---
packages: [react, react-dom]
level: beginner
adr: ADR-005
---

# React

**In one line:** The component library that draws every screen, from the login form to the interactive pattern viewer.

## What it is (plain words)

React builds a screen from small reusable pieces called components. A component is a function that takes inputs (props) and returns what to show; React updates only what changed.

## Why we chose it

- **A component model suits complex interactive tools.** The pattern viewer, the projector calibration and the design editor have lots of state and live updates; components keep each part small and testable.
- **Largest ecosystem.** Accessible primitives, form libraries, and 3D (React Three Fiber for the post-launch preview) are all React first.
- **Required by [Next.js](nextjs.md).** Choosing Next.js means choosing React.
- **Familiar to agents and future hires,** which keeps build cost low.

## Alternatives we considered (and why not)

- **Vue / Nuxt:** capable, but a smaller component ecosystem for what we need and not what [shadcn/ui](shadcn-ui.md) is built on.
- **Svelte / SvelteKit:** lighter, but a smaller ecosystem and hiring pool.

## When we would change it

Practically never; replacing React would mean rewriting every screen. We follow React major versions (the repo uses 19.x) as Next.js adopts them.

## Where it lives in our code

- `packages/ui/src/button.tsx` (the shared button component) and `packages/ui/src/index.ts`.
- `apps/web/src/app/[locale]/page.tsx` and `apps/web/src/app/[locale]/layout.tsx`.
- `packages/ui/package.json` lists React as a dev dependency for tests; the app supplies the real one.

## The 20% you need

- Props in, JSX out. Components stay presentational; hooks fetch and hold state ([CODING_STANDARDS section 4](../../CODING_STANDARDS.md)).
- Our button, the template for every shared component:

```tsx
// packages/ui/src/button.tsx
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: Readonly<ButtonProps>): ReactElement {
  const classes = `rounded-lg px-5 py-2.5 ... ${VARIANT_CLASSES[variant]} ${className}`;
  return <button type={type} className={classes.trim()} {...rest} />;
}
```

## Commands you'll use

`pnpm test` runs component tests (`packages/ui/src/button.test.tsx`); `pnpm dev` shows them live.

## Common mistakes

- Calling `fetch` or the database inside a component (use a hook).
- Copy-pasting JSX twice instead of extracting a `packages/ui` component (the duplicate check blocks it).
- Hard-coding Arabic or English text instead of using the messages files.

## Learn more

- [react.dev learn](https://react.dev/learn) (official, interactive)
- Glossary: [React](../glossary.md#react), [JSX](../glossary.md#jsx), [Client Component](../glossary.md#client-component)
