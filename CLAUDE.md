# CLAUDE.md — Tafsila (تفصيلة)

Read this first in every session. Then read only what the task needs: [docs/CONTEXT_MAP.md](docs/CONTEXT_MAP.md) lists the files for each task type.

## What this is

Web app that turns garment photos into accurate, ready-to-cut sewing patterns (Egypt first, Arabic RTL).
Core rule: **AI understands, the engine draws** — AI only fills/edits a validated `DesignSpec`; the deterministic TypeScript engine produces all geometry (ADR-002).

## Where to look

- Screen designs (match these for any UI work): `docs/design/screens/`
- UI copy rules and glossary (Arabic + English): `docs/design/copy.md`
- Milestone briefs (goal, scope, issues per milestone): `docs/milestones/`
- Which files to read for each task type: `docs/CONTEXT_MAP.md`
- Requirements (IDs like FR-PAT-03): `docs/SRS.md`
- Decisions already made — do not re-ask: `docs/DECISIONS.md` (ADR-001 to ADR-035) and `docs/decisions/` (one file per later decision)
- Lifecycle, labels, model choice, Definition of Done, milestones: `docs/WORKFLOW.md`
- Architecture of each part (web, api, engine, sim): `docs/ARCHITECTURE.md`
- Clean code rules, where code lives, JSDoc template: `docs/CODING_STANDARDS.md`
- Backend docs, tutorials, Docker, environments: `docs/backend/`
- Frontend docs (design system, RTL, state): `docs/frontend/README.md`
- Engine docs (methods, modules, validation, units): `docs/engine/README.md`
- Per-area agent notes (loaded with those files): `apps/web/CLAUDE.md`, `packages/api/CLAUDE.md`, `packages/engine/CLAUDE.md`
- Path-scoped rules and task skills: `.claude/rules/**` · `.claude/skills/` (`add-page`, `add-endpoint`, `add-garment-module`)
- Learn a term / technology / pattern (glossary, maps, reading paths): `docs/handbook/START_HERE.md`
- Manual test cases: `docs/test-cases/`
- Saved prompts: `.claude/commands/` (`/triage`, `/plan`, `/plan-milestone`, `/plan-wave`, `/build`, `/deliver`, `/review`, `/ship`, `/status`, `/release-check`, `/explain`, `/learn`, `/onboard`)

## Non-negotiable rules

1. Work only from a GitHub issue; never commit or push to `main`; never deploy to production.
2. Do not ask questions answered by the docs. Undocumented + cheap to reverse → decide and log it as a new file in `docs/decisions/` (named by the issue number). Costly/irreversible → `needs:decision` + one question.
3. Clean code per CODING_STANDARDS.md: no duplication (extract to the shared package), small functions, layers respected, **JSDoc purpose comment on every function, component and type**.
4. Tests for everything (unit, property for engine, e2e for flows, visual snapshots for patterns, API integration + permissions). `pnpm quality && pnpm test` must pass before every commit.
5. Same PR updates: SRS, the decision file, plans, test cases, OpenAPI/Postman, seed data, tutorials, and the status below when the milestone, the next step or an open decision changes.
6. Config only via `packages/config/env.ts`; secrets never in code, images or commits.
7. Talk to Merna in Arabic, short. Code, commits, issues, docs in English.
8. Save tokens: ask the `code-search` subagent where something lives instead of reading many files; run long test suites through the `test-runner` subagent (`.claude/agents/`). Hooks already format and lint each edited file and check affected packages before you finish; do not run those by hand after every edit.
9. **Unattended rule** (GitHub Actions `GITHUB_ACTIONS=true`, or a cloud session `CLAUDE_CODE_REMOTE=true`): if the same problem fails twice, stop, comment the problem on the issue and set `status:blocked`. Never switch to a bigger model on your own.
10. **Free tiers only until the beta (M8):** Vercel Hobby, Supabase Free, GitHub Free. If a step needs a paid plan, a paid add-on or a payment method, stop and add `needs:decision` (ADR-022).

## Repo map

`apps/web` (Next.js UI) · `packages/api` (Hono API: routes → services → ports/adapters) · `packages/engine` (pure pattern engine) · `packages/export` (print tiles, PDF) · `packages/schemas` (Zod) · `packages/ui` (shared components) · `packages/config` (env) · `packages/utils` · `packages/test-fixtures` · `services/sim` (v2 Python) · `supabase/` · `postman/` · `docs/`

## Commands

`pnpm dev:all` start everything · `pnpm test` · `pnpm test:e2e` · `pnpm quality` · `pnpm api:openapi` · `pnpm api:postman` · `pnpm api:check` · `pnpm api:test` · `pnpm gen endpoint|feature|garment-module <name> <issue>` · `pnpm docs:check` · `pnpm db:reset` · `pnpm docker:build`

## Current status

_Updated when the milestone, the next step or an open decision changes. What was done is in the merged PRs, the learning log and the board: a per-PR log here conflicted in every PR (#76)._

- Milestone: M1 - Accounts & data (built; closes after Merna's staging run of the exit check, #34)
- Next: M4 outputs, `/plan-wave M4`
- M2 engine built (#121–#147 merged); M2 exit #148 waits for toiles
- M3 UI built (#236–#253 merged); M3 exit #254 waits for engine bugs #229–#232
- M4 brief and issues drafted (#281–#296, `docs/milestones/M4-outputs.md`, ADR-281); next for M4: `/plan-wave M4` (screens #281 need Merna first)
- Open decisions: final product name/domain; AI provider after eval
