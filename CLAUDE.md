# CLAUDE.md — Tafsila (تفصيلة)

Read this first in every session. Then read only what the task needs.

## What this is

Web app that turns garment photos into accurate, ready-to-cut sewing patterns (Egypt first, Arabic RTL).
Core rule: **AI understands, the engine draws** — AI only fills/edits a validated `DesignSpec`; the deterministic TypeScript engine produces all geometry (ADR-002).

## Where to look

| Need                                                | File                                                                                                |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Requirements (IDs like FR-PAT-03)                   | `docs/SRS.md`                                                                                       |
| Decisions already made — do not re-ask              | `docs/DECISIONS.md`                                                                                 |
| Lifecycle, labels, model choice, Definition of Done | `docs/WORKFLOW.md`                                                                                  |
| Architecture of each part (web, api, engine, sim)   | `docs/ARCHITECTURE.md`                                                                              |
| Clean code rules, where code lives, JSDoc template  | `docs/CODING_STANDARDS.md`                                                                          |
| Backend docs, tutorials, Docker, environments       | `docs/backend/`                                                                                     |
| Manual test cases                                   | `docs/test-cases/`                                                                                  |
| Saved prompts                                       | `.claude/commands/` (`/triage`, `/plan`, `/build`, `/review`, `/ship`, `/status`, `/release-check`) |

## Non-negotiable rules

1. Work only from a GitHub issue; never commit or push to `main`; never deploy to production.
2. Do not ask questions answered by the docs. Undocumented + cheap to reverse → decide and log in DECISIONS.md. Costly/irreversible → `needs:decision` + one question.
3. Clean code per CODING_STANDARDS.md: no duplication (extract to the shared package), small functions, layers respected, **JSDoc purpose comment on every function, component and type**.
4. Tests for everything (unit, property for engine, e2e for flows, visual snapshots for patterns, API integration + permissions). `pnpm quality && pnpm test` must pass before every commit.
5. Same PR updates: SRS, DECISIONS, plans, test cases, OpenAPI/Postman, seed data, tutorials, and the status below.
6. Config only via `packages/config/env.ts`; secrets never in code, images or commits.
7. Talk to Merna in Arabic, short. Code, commits, issues, docs in English.

## Repo map

`apps/web` (Next.js UI) · `packages/api` (Hono API: routes → services → ports/adapters) · `packages/engine` (pure pattern engine) · `packages/schemas` (Zod) · `packages/ui` (shared components) · `packages/config` (env) · `packages/utils` · `packages/test-fixtures` · `services/sim` (v2 Python) · `supabase/` · `postman/` · `docs/`

## Commands

`pnpm dev:all` start everything · `pnpm test` · `pnpm test:e2e` · `pnpm quality` · `pnpm api:postman` · `pnpm api:test` · `pnpm db:reset` · `pnpm docker:build`

## Current status

_Updated at the end of every session._

- Milestone: M0 — repository setup (in progress)
- Last done: monorepo foundation: Next.js RTL web, Hono API (/api/health), engine (geometry + sleeve-cap solver), schemas, config, ui, utils, test-fixtures; lint/format/duplication/architecture checks green; 18 tests passing; standalone build verified
- Next: run scripts/bootstrap.sh on the Mac; create GitHub repo + board + labels; Supabase init; first issues from SRS M1
- Open decisions: final product name/domain; AI provider after eval
