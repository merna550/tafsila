# Tafsila — Development Workflow

How work moves from an idea to production, which Claude model does each step, and what every label means.
Agents must follow this file. Merna only: writes ideas, approves plans (when asked), reviews PRs/previews, and clicks "deploy to production".

---

## 1. Lifecycle

```
idea ─► /triage ─► status:needs-plan ─► /plan ─► status:plan-review ─► (Merna approves) ─► status:ready
                                   └──── plan:none ───────────────────────────────────────────┘
status:ready ─► /build ─► status:in-progress ─► PR + CI green + preview ─► status:in-review
status:in-review ─► (Merna: approve) ─► merge ─► status:on-staging ─► (Merna: deploy) ─► status:released
                └► (Merna: changes) ─► status:changes-requested ─► /build (fix) ─► status:in-review
any step ─► status:blocked (+ reason)          any open question ─► needs:decision
```

| Step          | Command                                | Who                          | Output                                                                                                          |
| ------------- | -------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Triage        | `/triage <idea or #issue>`             | Agent                        | Issue with all labels, size, model recommendation, SRS IDs, acceptance criteria                                 |
| Plan wave     | `/plan-wave [M<n>]`                    | Agent (Opus, Merna present)  | Plans every needs-plan issue whose dependencies are closed; one Arabic summary; `status:ready` after "approved" |
| Plan          | `/plan #N`                             | Agent (model from `plan:*`)  | Plan comment: files, steps, tests, risks, docs to update                                                        |
| Approve plan  | comment "approved"                     | Merna                        | Only for `plan:opus` or `size:L`; otherwise auto-approved                                                       |
| Build         | `/build #N`                            | Agent (model from `build:*`) | Branch, code, tests, docs, PR with preview link                                                                 |
| Review        | PR review                              | Merna                        | Approve or request changes                                                                                      |
| Ship          | `/ship #N` (merge)                     | Agent after approval         | Merge → staging deploy → smoke tests                                                                            |
| Release check | `/release-check`                       | Agent                        | List of High manual cases to run on staging + automated results                                                 |
| Release       | GitHub "Deploy to production" workflow | Merna (one click)            | Prod deploy + migrations + changelog                                                                            |

## 2. Choosing the model (save tokens)

Plan with a strong model **once**; build with the cheapest model that can follow the plan. Size and model are set during `/triage` and can be changed by Merna by swapping labels.

### Rubric

| Signal in the issue                                                                            | plan                   | build                                                          |
| ---------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------- |
| New pattern geometry, new garment module, drafting maths                                       | `plan:opus`            | `build:opus` for the geometry, `build:sonnet` for UI around it |
| Architecture, new external service, data model change, security, payments                      | `plan:opus`            | `build:sonnet`                                                 |
| Ambiguous requirement or touches 3+ areas                                                      | `plan:opus`            | `build:sonnet`                                                 |
| Hard bug with unknown cause                                                                    | `plan:opus` (diagnose) | `build:sonnet`                                                 |
| Clear feature following an existing pattern (new UI screen, new endpoint like an existing one) | `plan:sonnet`          | `build:sonnet`                                                 |
| Bug with known cause, small refactor                                                           | `plan:none`            | `build:sonnet`                                                 |
| Docs, copy/translation, config, label/CI tweaks, adding test cases to existing suites          | `plan:none`            | `build:haiku`                                                  |

Defaults when unsure: `plan:sonnet` + `build:sonnet`. In a session with Merna, escalate one tier if the build fails twice on the same problem; record it in the issue. **Unattended runs** (GitHub Actions or a cloud session) never escalate on their own: the same problem failing twice means stop, comment the problem on the issue and set `status:blocked` (ADR-017).

### Token-saving rules

1. **One plan, many builds.** The plan comment is the only context the build step needs, plus the files it names.
2. **Read by reference.** Read SRS sections by requirement ID, not the whole file. Read files named in the plan, not the whole repo.
3. **Fresh context per issue.** Start each issue in a new session (or `/clear`). Never carry a long chat into the next issue.
4. **Split big work.** `size:L` should be split; `size:XL` must be split before planning.
5. **No re-asking.** If the answer is in `CLAUDE.md`, `docs/SRS.md`, `docs/DECISIONS.md` or the issue, use it. Ask only for decisions that are costly or irreversible (money, prices, production data, deleting, new paid service); log the answer in `DECISIONS.md`.
6. **Short outputs.** Status updates are 3–5 lines. Long reasoning goes in the plan comment once.
7. **Read from the [context map](CONTEXT_MAP.md).** Each task type lists the few files to read.
8. **Delegate cheap work.** The `code-search` and `test-runner` subagents (haiku) find code and run tests, returning only paths or failures.
9. **Let hooks do the chores.** After each edit a hook runs Prettier and `eslint --fix` on that file; before the agent finishes, a hook typechecks and tests only the affected packages. CI does the same on PRs and checks everything on `main` (ADR-017).

### How to run each model

**The label picks the model automatically** (ADR-019). `/build` and `/plan` run `scripts/agent-model.mjs` to read the issue's `build:*` / `plan:*` label and hand the whole job to the matching subagent in `.claude/agents/`: `builder-haiku`, `builder-sonnet`, `builder-opus`, `planner-sonnet`, `planner-opus` (each pins its `model:` and stops after 50 turns). The session you start in only routes and relays the summary, so its own model barely matters; the project default is `sonnet` (`.claude/settings.json`). A missing or unknown label means sonnet, and the agent says so. `plan:none` skips planning. The step instructions live in `.claude/procedures/build.md` and `plan.md`. To change the model, swap the label; do not pick a model by hand.

- **Claude Code (local):** just run `claude` and `/plan #N` or `/build #N`; the label chooses the subagent model. `/model` changes only the routing session.
- **Claude Code on the web (claude.ai/code, also from the phone):** connect GitHub once with `/web-setup`, then run `/build #N`. It runs in Anthropic's cloud with the laptop off, pushes a branch and opens a PR. Uses the Claude subscription. Best for long tasks.
- **GitHub Action (unattended):** `.github/workflows/claude.yml` runs on an `@claude` comment from Merna or on a call from the dispatcher (`.github/workflows/dispatch.yml`, started when an issue becomes ready or a slot frees up, plus every 6 hours as a safety net, one issue at a time, at most `DISPATCH_DAILY_LIMIT` builds a day (default 4), paused when 3 PRs wait or `DISPATCH_ENABLED=false`). Every run stops after 50 turns (`--max-turns 50`). The model comes from the issue's `build:*` label; an `@claude` comment on a PR uses the label of the issue the PR closes (closing reference or `Closes #N`). No Claude GitHub App is installed, so auto-fix on PRs is not used. Setup, cost and stopping: [run-agents-in-cloud](backend/tutorials/run-agents-in-cloud.md) (ADR-016).
- Model tiers map to the current versions of Opus / Sonnet / Haiku; update this line if the team pins exact model IDs.

## 3. Labels (full list in `.github/labels.yml`)

| Group    | Labels                                                                              | Rule                               |
| -------- | ----------------------------------------------------------------------------------- | ---------------------------------- |
| Status   | `status:triage` … `status:released`                                                 | Exactly one; automation updates it |
| Model    | `plan:opus/sonnet/none`, `build:opus/sonnet/haiku`                                  | Exactly one of each                |
| Size     | `size:XS … XL`                                                                      | Exactly one; XL must be split      |
| Type     | `type:feature/bug/chore/docs/test/spike`                                            | Exactly one                        |
| Priority | `priority:P0 … P3`                                                                  | Exactly one                        |
| Area     | `area:engine/ui/api/db/ai/payments/3d/infra/docs`                                   | One or more                        |
| Flags    | `needs:decision`, `needs:interactive`, `needs:sew-test`, `agent:auto`, `good-first` | Optional                           |

## 4. Definition of Ready (before /build)

- Acceptance criteria written as checkboxes.
- SRS requirement IDs linked (or a new requirement added to SRS in the same PR).
- Plan comment exists, or `plan:none`.
- No `needs:decision`.
- Work that touches `.claude/` (settings, agents, commands, hooks, and `scripts/hooks/`) carries `needs:interactive`: approvals for Claude's own configuration cannot be given in an unattended run, so the dispatcher never picks it; build it in an interactive session (issue #58).

## 5. Definition of Done (before status:in-review)

- [ ] Code follows `docs/CODING_STANDARDS.md`: no duplicated logic (shared code extracted and imported), layers respected, JSDoc purpose comment on every function/component/type. `pnpm quality` green.
- [ ] Code + tests (unit; property tests for engine; e2e for user flows; visual snapshot for pattern output).
- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass locally and in CI; coverage thresholds met.
- [ ] Preview deployment link in the PR, with screenshots for visual changes.
- [ ] Docs updated: SRS (behaviour), DECISIONS (choices), CLAUDE.md status.
- [ ] Manual test cases: `docs/test-cases/<area>/<N>-<slug>.md` (happy path, errors, permissions, edge sizes, RTL, mobile), each marked automated or manual-only.
- [ ] Plan saved to `docs/plans/<N>-<slug>.md`.
- [ ] New concepts added to `docs/handbook/` (glossary / tech card / pattern) and listed in `learning-log.md`; the PR has a "Concepts introduced" section; `pnpm docs:check` passes.
- [ ] Docker: image still builds, passes hadolint/Trivy and the container smoke test (CI `Docker image` workflow). New env vars added to `.env.example`, `.env.docker.example` and `.github/ci.env` (placeholder).
- [ ] Backend changes: OpenAPI + Postman regenerated (`pnpm api:openapi && pnpm api:postman`), `pnpm api:test` passes on local, seed data + `seed-data.md` updated, the relevant tutorial updated (or a new one added).
- [ ] Every acceptance criterion is ticked in the issue (`scripts/gh-ac.sh check <issue> <n…>`) as soon as it is met and verified; an issue is not moved to In review with unticked criteria unless the PR explains why. The PR body includes `scripts/gh-ac.sh progress <issue>`.
- [ ] Conventional commits referencing the issue; PR body has `Closes #N`.
- [ ] `needs:sew-test` issues: note what was physically tested, or keep the flag open.

## 6. Documentation map

| Need                                | Where                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| What we build                       | `docs/SRS.md`                                                                                      |
| Why we chose X                      | `docs/DECISIONS.md`                                                                                |
| How a feature was planned           | `docs/plans/`                                                                                      |
| How to test by hand                 | `docs/test-cases/` (+ generated `index.md`)                                                        |
| Learn a term / technology / pattern | `docs/handbook/` (start at `START_HERE.md`; glossary, maps, patterns, tech cards, troubleshooting) |
| Backend how-tos                     | `docs/backend/` and `docs/backend/tutorials/`                                                      |
| Docker / containers                 | `docs/backend/tutorials/docker.md`                                                                 |
| Try the API                         | `postman/` (import + Run)                                                                          |
| API reference                       | `/api/docs` (generated)                                                                            |

## 7. Environments

| Env     | Trigger                                 | Data                           | Payments       | AI               |
| ------- | --------------------------------------- | ------------------------------ | -------------- | ---------------- |
| dev     | `pnpm dev`                              | Supabase local (Docker) + seed | Paymob sandbox | cheapest model   |
| preview | every PR                                | Supabase branch                | sandbox        | cheapest model   |
| staging | merge to `main`                         | Supabase staging project       | sandbox        | production model |
| prod    | "Deploy to production" workflow (Merna) | Supabase prod project          | live           | production model |

All config goes through `packages/config/env.ts` (Zod-validated); the app refuses to start with missing/invalid variables. Migrations live in `supabase/migrations` and are applied by CI: staging on merge, prod on release.

## 8. GitHub board and milestones

Board: **Tafsila** project (`merna550`, project #4). Columns: Backlog → Ready → In progress → In review → Done.
Helper: `scripts/gh-project.sh add <url> [column]` and `scripts/gh-project.sh status <url> <column>` (needs `gh auth refresh -s project` once).
Acceptance criteria: `scripts/gh-ac.sh list|check|uncheck|progress <issue> [n…]` reads and ticks the `## Acceptance criteria` checkboxes in the issue body. `/build` ticks, `/review` and `/ship` require N/N, `/status` shows `x/y criteria`.

| Status label                                               | Board column | Set by                     |
| ---------------------------------------------------------- | ------------ | -------------------------- |
| `status:triage`, `status:needs-plan`, `status:plan-review` | Backlog      | `/triage`, `/plan`         |
| `status:ready`                                             | Ready        | `/triage` or `/plan`       |
| `status:in-progress`, `status:changes-requested`           | In progress  | `/build`                   |
| `status:in-review` (issue) and its PR                      | In review    | `/build`                   |
| closed / merged                                            | Done         | board workflow (automatic) |

Every issue and its PR carry the same milestone. Each active milestone has a one-page brief in [docs/milestones/](milestones/README.md). Rule: write the next milestone's brief when the current one is about 70% done. `/plan-milestone M<n>` (Opus, once per milestone) writes the brief and drafts its issues as `status:plan-review` in Backlog; `/plan-wave` (Opus, with Merna present) then plans every `needs-plan` issue whose dependencies are all closed, in one session, posts each plan on its issue, gives Merna one short Arabic summary of the decisions, and after she replies "approved" (or "approved except #N") sets them to `status:ready`. Milestone map (SRS §12; titles match GitHub exactly):

| Milestone                      | Work that belongs there                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| M0 - Foundation & environments | repo, tooling, CI/CD, agent config, docs/process, dev/staging/prod environments, domain, Sentry, PostHog                |
| M1 - Accounts & data           | auth + phone OTP, profiles, client profiles, measurements UI and guide, Egyptian size chart, DB schema + RLS, seed data |
| M2 - Engine core               | schemas, blocks, dress/skirt/blouse modules, seam allowance, notches, grain, labels, validation                         |
| M3 - Design & pattern UI       | manual design picker, pattern viewer, validation report UI, versions                                                    |
| M4 - Outputs                   | projector + calibration, direct-cut steps, PDF A4/A0                                                                    |
| M5 - Fabric                    | yardage/nesting, fabric catalogue and rules, recommendations                                                            |
| M6 - AI layer                  | photo analysis, confirmation UI, chat edits                                                                             |
| M7 - Billing & admin           | credits, free trial, Paymob, plans, receipts, admin dashboard                                                           |
| M8 - Beta & launch readiness   | closed beta, feedback loop, privacy policy/terms, landing page, onboarding, FAQ                                         |
| M9 - Public launch             | production release, monitoring, launch marketing                                                                        |
| Post-launch                    | 3D assembly preview, abaya/isdal/trousers, stretch fabrics                                                              |
