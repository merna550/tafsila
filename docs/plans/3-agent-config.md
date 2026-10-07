# Plan #3: per-area agent configuration

Issue: #3 · plan:sonnet · build:sonnet · Milestone: M0 - Foundation & environments

## Goal

Give each part of the monorepo its own agent rules, skills and docs, so an agent loads only the rules for the files it edits.

## Steps

1. Nested `CLAUDE.md` files (≤ 60 lines each, linking to the root instead of repeating it):
   - `apps/web`
   - `packages/api`
   - `packages/engine`
2. Six path-scoped rule files in `.claude/rules/**`:
   - `frontend/components`
   - `frontend/rtl-i18n`
   - `backend/api-design`
   - `backend/database`
   - `engine/drafting`
   - `testing`
3. Three skills in `.claude/skills/`: `add-page`, `add-endpoint`, `add-garment-module`. Each links to the existing tutorials and ends with the Definition of Done.
4. New docs: `docs/frontend/README.md` and `docs/engine/README.md`. Link them from `CLAUDE.md` and `docs/ARCHITECTURE.md`.
5. ADR-008 in `docs/DECISIONS.md` (ADR-007 was already used by #1). Update the `CLAUDE.md` status.
6. Remove `esbuild.jsx` from `packages/ui/vitest.config.ts`. The automatic JSX runtime is Vitest's default.
7. Extra fixes:
   - `docs/backend/tutorials/add-endpoint.md` pointed to the old `apps/web/server/*` paths; it now points to `packages/api/src/*`.
   - `scripts/gh-project.sh` now has execute permission.

## Tests

- `pnpm quality && pnpm test` green, with no Vitest config warning.
- `wc -l` confirms each nested `CLAUDE.md` is ≤ 60 lines.

## Risks

- Rules can drift from `ARCHITECTURE.md` and `CODING_STANDARDS.md`. Mitigation: rules link to those docs, and `/review` checks them.
