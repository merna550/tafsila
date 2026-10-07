---
packages: [zustand]
level: intermediate
adr: ADR-011
---

# Zustand

**In one line:** A tiny store for state that lives only in the browser, used for the pattern-editor session. Planned for M3.

## What it is (plain words)

Zustand gives you a hook-based store: `const zoom = useEditor((s) => s.zoom)`. No providers, no reducers; state is a plain object with functions that update it.

## Why we chose it

- **The editor has many small pieces of local state:** the selected pattern piece, zoom and pan, which neckline is being previewed, unsaved changes. They must be shared across components without prop drilling (rule: max 2 levels).
- **Tiny and simple.** Under a page of code per store, easy for agents to write correctly.
- **Keeps server data out.** Only the editor session goes here; everything fetched is in [TanStack Query](tanstack-query.md).

## Alternatives we considered (and why not)

- **Redux Toolkit:** too much ceremony for one editor.
- **React context:** re-renders everything below it on every change; poor for a live drawing surface.

## When we would change it

If editor state becomes large and needs time travel (undo/redo history), we would evaluate a dedicated model; Zustand middleware may already be enough.

## Where it lives in our code

Not installed yet. Planned: apps/web/src/features/pattern-editor/ hooks. The overall rule is in the [frontend docs](../../frontend/README.md).

## The 20% you need

```ts
// planned shape
const useEditor = create<EditorState>()((set) => ({
  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
}));
```

Select only what you need (`useEditor((s) => s.zoom)`) so components re-render less.

## Commands you'll use

None of its own; it is a library used inside hooks, and tests import the store directly.

## Common mistakes

- Storing API data in the store (it will go stale).
- One global store for everything; create one small store per feature.

## Learn more

- [Zustand docs](https://zustand.docs.pmnd.rs/) (official)
- Glossary: [Zustand](../glossary.md#zustand)
