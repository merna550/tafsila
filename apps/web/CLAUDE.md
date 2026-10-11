# apps/web — agent notes

Next.js App Router UI, Arabic RTL first. Root rules in `/CLAUDE.md` still apply; this file adds only what is specific to the frontend.
Full guide: `docs/frontend/README.md` · Architecture: `docs/ARCHITECTURE.md` §1 · Standards: `docs/CODING_STANDARDS.md` §4.

## Structure (feature-sliced)

```
src/app/          routes only: thin pages that compose features, no logic
src/features/<f>/ components/ hooks/ <f>.schema.ts index.ts (the only public entry)
src/entities/     small shared domain views (Design, Client, PatternVersion)
src/shared/       api client, i18n, query client, workers, analytics
```

- Import direction: `app → features → entities → shared → packages/*`. Another feature only via its `index.ts`.
- New screen or feature: use the `add-page` skill.

## Server vs Client components

- Pages and data loading are Server Components by default.
- `"use client"` only for interactive tools: viewer, projector, direct-cut, 3D, forms.
- Heavy work (fabric nesting, PDF tiling) runs in a Web Worker under `src/shared/workers/`.

## Data and state

- Four layers per feature: `components/` (UI) → `hooks/` (application) → `model/` (pure domain) → `shared/api` (data). Components never fetch; only `shared/api` calls `fetch`; Supabase only in `shared/auth`. Server state = TanStack Query hooks in `features/<f>/hooks/`. Details and examples: `.claude/rules/frontend/`.
- Errors: components read `ApiError` only (`placementFor` picks the place); see `docs/errors.md`.
- Local UI state = component state; Zustand only for the pattern-editor session.
- Pattern geometry comes from `@tafsila/engine`; never compute geometry in the UI.

## UI and RTL

- Build from `packages/ui` first. A pattern used twice becomes a `packages/ui` component; never restyle primitives ad hoc.
- Every user-facing string comes from `messages/{ar,en}.json` (next-intl). No hard-coded text.
- Logical CSS only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start`/`end`), never `left`/`right` or `ml-*`/`mr-*`. Tokens only: no raw colours or `bg-[...]` (ESLint fails).
- Western digits by default (NFR-06).

## Tests

- Component tests next to the component (`*.test.tsx`).
- User flows: Playwright e2e (`pnpm test:e2e`), run in both `ar` and `en`.
- Visual changes: screenshots in the PR.
