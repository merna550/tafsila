---
paths:
  - "apps/web/**/*.tsx"
  - "packages/ui/**"
---

# React components

- A component receives data through typed props with JSDoc and renders it; it never calls `fetch` or Supabase.
- Data fetching and mutations live in `features/<feature>/hooks/` and use the typed API client.
- A screen is built from `packages/ui` components; JSX repeated twice becomes a `packages/ui` component.
- Props are never drilled more than 2 levels; use a hook or context instead.
- `"use client"` appears only on interactive tools and forms; pages stay Server Components.
