# CLAUDE.md — Tafsila (تفصيلة)

Read this first in every session. Then read only what the task needs: [docs/CONTEXT_MAP.md](docs/CONTEXT_MAP.md) lists the files for each task type.

## What this is

Web app that turns garment photos into accurate, ready-to-cut sewing patterns (Egypt first, Arabic RTL).
Core rule: **AI understands, the engine draws** — AI only fills/edits a validated `DesignSpec`; the deterministic TypeScript engine produces all geometry (ADR-002).

## Where to look

| Need                                                                | File                                                                                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Which files to read for each task type                              | `docs/CONTEXT_MAP.md`                                                                                                                 |
| Requirements (IDs like FR-PAT-03)                                   | `docs/SRS.md`                                                                                                                         |
| Decisions already made — do not re-ask                              | `docs/DECISIONS.md`                                                                                                                   |
| Lifecycle, labels, model choice, Definition of Done, milestones     | `docs/WORKFLOW.md`                                                                                                                    |
| Architecture of each part (web, api, engine, sim)                   | `docs/ARCHITECTURE.md`                                                                                                                |
| Clean code rules, where code lives, JSDoc template                  | `docs/CODING_STANDARDS.md`                                                                                                            |
| Backend docs, tutorials, Docker, environments                       | `docs/backend/`                                                                                                                       |
| Frontend docs (design system, RTL, state)                           | `docs/frontend/README.md`                                                                                                             |
| Engine docs (methods, modules, validation, units)                   | `docs/engine/README.md`                                                                                                               |
| Per-area agent notes (loaded with those files)                      | `apps/web/CLAUDE.md`, `packages/api/CLAUDE.md`, `packages/engine/CLAUDE.md`                                                           |
| Path-scoped rules and task skills                                   | `.claude/rules/**` · `.claude/skills/` (`add-page`, `add-endpoint`, `add-garment-module`)                                             |
| Learn a term / technology / pattern (glossary, maps, reading paths) | `docs/handbook/START_HERE.md`                                                                                                         |
| Manual test cases                                                   | `docs/test-cases/`                                                                                                                    |
| Saved prompts                                                       | `.claude/commands/` (`/triage`, `/plan`, `/build`, `/review`, `/ship`, `/status`, `/release-check`, `/explain`, `/learn`, `/onboard`) |

## Non-negotiable rules

1. Work only from a GitHub issue; never commit or push to `main`; never deploy to production.
2. Do not ask questions answered by the docs. Undocumented + cheap to reverse → decide and log in DECISIONS.md. Costly/irreversible → `needs:decision` + one question.
3. Clean code per CODING_STANDARDS.md: no duplication (extract to the shared package), small functions, layers respected, **JSDoc purpose comment on every function, component and type**.
4. Tests for everything (unit, property for engine, e2e for flows, visual snapshots for patterns, API integration + permissions). `pnpm quality && pnpm test` must pass before every commit.
5. Same PR updates: SRS, DECISIONS, plans, test cases, OpenAPI/Postman, seed data, tutorials, and the status below.
6. Config only via `packages/config/env.ts`; secrets never in code, images or commits.
7. Talk to Merna in Arabic, short. Code, commits, issues, docs in English.
8. Save tokens: ask the `code-search` subagent where something lives instead of reading many files; run long test suites through the `test-runner` subagent (`.claude/agents/`). Hooks already format and lint each edited file and check affected packages before you finish; do not run those by hand after every edit.
9. **Unattended rule** (GitHub Actions `GITHUB_ACTIONS=true`, or a cloud session `CLAUDE_CODE_REMOTE=true`): if the same problem fails twice, stop, comment the problem on the issue and set `status:blocked`. Never switch to a bigger model on your own.

## Repo map

`apps/web` (Next.js UI) · `packages/api` (Hono API: routes → services → ports/adapters) · `packages/engine` (pure pattern engine) · `packages/schemas` (Zod) · `packages/ui` (shared components) · `packages/config` (env) · `packages/utils` · `packages/test-fixtures` · `services/sim` (v2 Python) · `supabase/` · `postman/` · `docs/`

## Commands

`pnpm dev:all` start everything · `pnpm test` · `pnpm test:e2e` · `pnpm quality` · `pnpm api:postman` · `pnpm api:test` · `pnpm docs:check` · `pnpm db:reset` · `pnpm docker:build`

## Current status

_Updated at the end of every session._

- Milestone: M0 - Foundation & environments (in progress)
- Last done: `/build` and `/plan` delegate to `builder-*` / `planner-*` subagents pinned to the label's model, `scripts/agent-model.mjs`, `@claude` on a PR uses the linked issue's label, default model sonnet (ADR-019, #40); dispatcher fix: `build / claude` was skipped under `workflow_call`, now gated on `inputs.issue`; `dry_run` input; workflow YAML tests; checkout/setup-node v5 (ADR-018, #38, PR open); token-saving setup: format/lint and affected-only Stop hooks, `code-search` and `test-runner` subagents, affected-only PR CI, `docs/CONTEXT_MAP.md`, cloud cost guards (`--max-turns 50`, `DISPATCH_DAILY_LIMIT`, unattended rule), ADR-017 (#17, PR open; after merge Merna turns the dispatcher on); cloud agents without the GitHub App: SessionStart hook (cloud-only), `claude.yml`, dispatcher, tutorial, ADR-016 (#16); handbook upkeep `pnpm docs:check` (#10); 33 technology cards (#9); handbook core (#8); MVP milestone plan v2 (#6)
- Next: Supabase init; first issues from SRS M1
- Open decisions: final product name/domain; AI provider after eval
