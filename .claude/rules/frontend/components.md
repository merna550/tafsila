---
paths:
  - "apps/web/**/*.tsx"
  - "packages/ui/**"
---

# React components

- A component receives typed props (JSDoc on each) and renders; it never calls `fetch`, TanStack Query or Supabase (layers: `layering.md`).
- A screen is built from `packages/ui` components. JSX repeated twice becomes a `packages/ui` component with a test and a story.
- Style only with design tokens (`packages/ui/src/tokens.css`): no `#hex`, `rgb()`, `bg-[...]` or Tailwind palette colours in features. ESLint fails on them.
- Compose, do not configure: prefer `children` and slots over many boolean props. More than 2 levels of prop drilling means a hook or context.
- Every data screen shows three states from shared components: loading `Skeleton`, empty `EmptyState`, error `ErrorState`.
- Accessibility: every control has a visible label or `aria-label` (from messages); focus is visible and never removed; text contrast meets WCAG AA with the token pairs; dialogs trap focus and close on Escape; click targets are at least 44px on touch.
- Performance: pages and data loading are Server Components; `"use client"` only on interactive leaves; heavy work in a Web Worker; images through `next/image`.

```tsx
// WRONG
<button className="bg-[#be123c] ml-4 px-[13px]" style={{ color: "white" }}>ارسال</button>

// RIGHT
<Button variant="primary" className="ms-4">{t("common.send")}</Button>
```

```tsx
// WRONG: three states forgotten
return <Table rows={data.rows} />;

// RIGHT
if (query.isPending) return <Skeleton variant="table" />;
if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;
if (rows.length === 0) return <EmptyState title={t("clients.empty")} />;
return <Table rows={rows} />;
```
