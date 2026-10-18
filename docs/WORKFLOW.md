# Tafsila — Development Workflow

How work moves from an idea to production, which Claude model does each step, and what every label means.
Agents must follow this file. Merna only: writes ideas, approves plans (when asked), reviews PRs/previews, and clicks "deploy to production".

---

## 1. Lifecycle

```
idea ─► /triage ─► status:needs-plan ─► /plan ─► status:plan-review ─► (Merna approves) ─► status:ready
                                   └──── plan:none ───────────────────────────────────────────┘
status:ready ─► /build ─► status:in-progress ─► PR + CI green + preview ─► status:in-review
status:ready ─► /deliver ─► in-progress ─► PR ─► gate ─► merge ─► on-staging   (build, CI, fix and merge in one command)
status:in-review ─► (Merna: approve) ─► merge ─► status:on-staging ─► (Merna: deploy) ─► status:released
                └► (Merna: changes) ─► status:changes-requested ─► /build (fix) ─► status:in-review
any step ─► status:blocked (+ reason)          any open question ─► needs:decision
```

| Step          | Command                                | Who                          | Output                                                                                                          |
| ------------- | -------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Triage        | `/triage <idea or #issue>`             | Agent                        | Issue with all labels, size, model recommendation, SRS IDs, acceptance criteria                                 |
| Plan wave     | `/plan-wave [M<n>]`                    | Agent (Opus, Merna present)  | Plans every needs-plan issue whose dependencies are closed; one Arabic summary; `status:ready` after "approved" |
| Plan          | `/plan #N`                             | Agent (model from `plan:*`)  | Plan comment: files, steps, tests, risks, docs to update                                                        |
| Approve plan  | label `status:ready`                   | Merna                        | Only for `plan:opus` or `size:L`; otherwise auto-approved. Claude sets it only after Merna says "approved"      |
| Build         | `/build #N`                            | Agent (model from `build:*`) | Branch, code, tests, docs, PR with preview link and green CI                                                    |
| Deliver       | `/deliver #N` or `/deliver next`       | Agent after `status:ready`   | Build, CI wait, fixes (2 resends), gate, squash merge, next issue; Arabic summary; never approves a plan        |
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

### Review the weekly agent report

Every Sunday `agent-report.yml` opens or updates the issue "Agent usage report — week N". Read its flags and suggestions, then adjust model labels, issue sizes and the `CLAUDE.md` / `docs/CONTEXT_MAP.md` files from it ([tutorial](backend/tutorials/agent-usage.md), ADR-028).

### Token-saving rules

1. **One plan, many builds.** The plan comment is the only context the build step needs, plus the files it names.
2. **Read by reference.** Read SRS sections by requirement ID, not the whole file. Read files named in the plan, not the whole repo.
3. **Fresh context per issue.** Start each issue in a new session (or `/clear`). Never carry a long chat into the next issue.
4. **Split big work.** `size:L` should be split; `size:XL` must be split before planning.
5. **No re-asking.** If the answer is in `CLAUDE.md`, `docs/SRS.md`, `docs/DECISIONS.md`, `docs/decisions/` or the issue, use it. Ask only for decisions that are costly or irreversible (money, prices, production data, deleting, new paid service); log the answer in `DECISIONS.md`.
6. **Short outputs.** Status updates are 3–5 lines. Long reasoning goes in the plan comment once.
7. **Read from the [context map](CONTEXT_MAP.md).** Each task type lists the few files to read.
8. **Delegate cheap work.** The `code-search` and `test-runner` subagents (haiku) find code and run tests, returning only paths or failures.
9. **Let hooks do the chores.** After each edit a hook runs Prettier and `eslint --fix` on that file; before the agent finishes, a hook typechecks and tests only the affected packages. CI does the same on PRs and checks everything on `main` (ADR-017).

### How to run each model

**The label picks the model automatically** (ADR-019). `/build` and `/plan` run `scripts/agent-model.mjs` to read the issue's `build:*` / `plan:*` label and hand the whole job to the matching subagent in `.claude/agents/`: `builder-haiku`, `builder-sonnet`, `builder-opus`, `planner-sonnet`, `planner-opus` (each pins its `model:` and stops after 50 turns). The session you start in only routes and relays the summary, so its own model barely matters; the project default is `sonnet` (`.claude/settings.json`). A missing or unknown label means sonnet, and the agent says so. `plan:none` skips planning. The step instructions live in `.claude/procedures/build.md` and `plan.md`. To change the model, swap the label; do not pick a model by hand.

- **Claude Code (local):** just run `claude` and `/plan #N` or `/build #N`; the label chooses the subagent model. `/model` changes only the routing session.
- **Claude Code on the web (claude.ai/code, also from the phone):** connect GitHub once with `/web-setup`, then run `/build #N`. It runs in Anthropic's cloud with the laptop off, pushes a branch and opens a PR. Uses the Claude subscription. Best for long tasks.
- **GitHub Action (unattended):** `.github/workflows/claude.yml` runs on an `@claude` comment from Merna or on a call from the dispatcher (`.github/workflows/dispatch.yml`, started when an issue becomes ready or a slot frees up, plus every 12 hours as a safety net, one issue at a time, only issues labelled `agent:auto` (Merna opts each one in, ADR-86), at most `DISPATCH_DAILY_LIMIT` builds a day (default 4), paused when 3 PRs wait or `DISPATCH_ENABLED=false`). Every run stops after 50 turns (`--max-turns 50`). The model comes from the issue's `build:*` label; an `@claude` comment on a PR uses the label of the issue the PR closes (closing reference or `Closes #N`). No Claude GitHub App is installed, so auto-fix on PRs is not used. Setup, cost and stopping: [run-agents-in-cloud](backend/tutorials/run-agents-in-cloud.md) (ADR-016).
- Model tiers map to the current versions of Opus / Sonnet / Haiku; update this line if the team pins exact model IDs.

The builder does not stop after opening its PR. It runs `node scripts/ci-wait.mjs <pr-number>`, waits for every check on the current head, fixes a red result and pushes again for at most three rounds. The script reports the PR's mergeable state and only the matching failure lines from a failed job, so the builder sees the cause without loading the complete log. A timeout or a third red round blocks the issue instead of leaving CI polling to Merna.

### Who builds an issue: `/deliver` or the dispatcher (issue #185)

An issue is built by exactly one of them. `agent:auto` = the dispatcher (`dispatch.mjs`); every other issue = `/deliver` (or `/build`). `/deliver` refuses `agent:auto` issues. The dispatcher only considers an issue whose single status label is `status:ready` and which has no open PR (found by `Closes #N` or the branch name `<type>/N-...`, never by a plain mention). `/deliver` merges only through `scripts/deliver.mjs merge`: the gate re-checks the required checks (`REQUIRED_CHECKS` in `scripts/deliver-rules.mjs`), the closing keyword, `needs:decision` and the criteria, and pins the head SHA. `/deliver` refuses a PR whose base is not `main` and, after merging, reports files of the PR that are missing on `main` (`missingOnMain`) and blocks. Decisions: [185-deliver-merge-gate](decisions/185-deliver-merge-gate.md), [186-pr-issue-link](decisions/186-pr-issue-link.md).

### Repository settings for /deliver (Merna, optional second guard)

`/deliver` works without these; they stop any other merge path too. Everything below is free (the repo is public).

1. Settings, Branches, add a rule for `main`: "Require a pull request before merging" (0 approvals); "Require status checks to pass": `quality`, `build`, `e2e`, `db-reset`, `storybook` (do not tick "Require branches to be up to date"); "Do not allow bypassing the above settings"; block force pushes and deletion.
2. Settings, General, Pull Requests: keep "Allow squash merging" on, turn on "Automatically delete head branches", leave "Allow auto-merge" off.

## 3. Labels (full list in `.github/labels.yml`)

| Group    | Labels                                                                              | Rule                                                                                        |
| -------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Status   | `status:triage` … `status:released`                                                 | Exactly one; automation updates it (`/build` and `/deliver` swap `ready` for `in-progress`) |
| Model    | `plan:opus/sonnet/none`, `build:opus/sonnet/haiku`                                  | Exactly one of each                                                                         |
| Size     | `size:XS … XL`                                                                      | Exactly one; XL must be split                                                               |
| Type     | `type:feature/bug/chore/docs/test/spike`                                            | Exactly one                                                                                 |
| Priority | `priority:P0 … P3`                                                                  | Exactly one                                                                                 |
| Area     | `area:engine/ui/api/db/ai/payments/3d/infra/docs`                                   | One or more                                                                                 |
| Flags    | `needs:decision`, `needs:interactive`, `needs:sew-test`, `agent:auto`, `good-first` | Optional                                                                                    |

## 4. Definition of Ready (before /build)

- Acceptance criteria written as checkboxes.
- SRS requirement IDs linked (or a new requirement added to SRS in the same PR).
- Plan comment exists, or `plan:none`.
- No `needs:decision`.
- Dispatcher opt-in: only issues with `agent:auto` are built by the dispatcher (ADR-86). Add the label yourself when you want an issue built unattended; without it the issue waits for an interactive `/build`. `/triage` never adds it.
- Work that touches `.claude/` (settings, agents, commands, hooks, and `scripts/hooks/`) carries `needs:interactive`: Claude's own configuration is a safety boundary built with Merna present, so the dispatcher never picks it; build it in an interactive session (issue #58).

## 5. Definition of Done (before status:in-review)

- [ ] Code follows `docs/CODING_STANDARDS.md`: no duplicated logic (shared code extracted and imported), layers respected, JSDoc purpose comment on every function/component/type. `pnpm quality` green.
- [ ] Code + tests (unit; property tests for engine; e2e for user flows; visual snapshot for pattern output).
- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass locally and in CI; coverage thresholds met.
- [ ] Preview deployment link in the PR, with screenshots for visual changes.
- [ ] Docs updated: SRS (behaviour), a decision file in `docs/decisions/` (choices), CLAUDE.md status when the milestone, next step or an open decision changed.
- [ ] Manual test cases: `docs/test-cases/<area>/<N>-<slug>.md` (happy path, errors, permissions, edge sizes, RTL, mobile), each marked automated or manual-only.
- [ ] Plan copied from the approved issue comment to `docs/plans/<N>-<slug>.md` in the build PR, with a "Deviations" section.
- [ ] New concepts added to `docs/handbook/` (glossary / tech card / pattern) and listed as a file in `docs/handbook/learning-log/` (then `pnpm learning-log:index`); the PR has a "Concepts introduced" section; `pnpm docs:check` passes.
- [ ] Docker: image still builds, passes hadolint/Trivy and the container smoke test (CI `Docker image` workflow; it and Storybook run only when the change can affect them, see [ADR-86](decisions/86-cut-actions-minutes.md) and [what costs minutes](backend/ci-minutes.md)). New env vars added to `.env.example`, `.env.docker.example` and `.github/ci.env` (placeholder).
- [ ] Backend changes: OpenAPI + Postman regenerated (`pnpm api:openapi && pnpm api:postman`), `pnpm api:test` passes on local, seed data + `seed-data.md` updated, the relevant tutorial updated (or a new one added).
- [ ] Every acceptance criterion is ticked in the issue (`scripts/gh-ac.sh check <issue> <n…>`) as soon as it is met and verified; an issue is not moved to In review with unticked criteria unless the PR explains why. The PR body includes `scripts/gh-ac.sh progress <issue>`.
- [ ] Conventional commits referencing the issue; PR body has `Closes #N` as its first line (never `Part of #N`) and the PR base is `main` (issue #186; `.github/workflows/pr-link.yml` adds a missing keyword, comments and labels `needs:link` on `Part of #N`, and fails a base other than `main` unless the PR has the label `stacked`).
- [ ] `needs:sew-test` issues have **no** toile acceptance criterion (the PR's `Closes #N` would close the issue while it is open). Instead the builder opens (or updates) one follow-up issue `test(engine): sew-test toiles for #N` and puts `Sew-test follow-up: #M` in the PR body (CI warns when it is missing, `scripts/sew-test-followup.mjs`). See "Sew-test follow-up issues" below.

### Sew-test follow-up issues

Physical toiles are tracked in their own issue so code issues close cleanly and nothing physical is forgotten (issue #184).

- Follow-up issue: title `test(engine): sew-test toiles for #N`, labels `type:test`, `needs:sew-test`, `area:engine`, `plan:none`, `status:ready`, the same milestone as #N.
- Body checklist: print each size with `pnpm engine:print` (1:1 SVG), sew three sizes (S, M, XXL or as Merna picks), log one row per size in `docs/test-cases/engine/sew-tests.md`, open a bug per fit problem, then remove `needs:sew-test` from #N.
- The milestone exit issue lists the follow-ups under "Depends on".
- Merna logs the results; the builder does not.

## 6. Documentation map

| Need                                | Where                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| What we build                       | `docs/SRS.md`                                                                                      |
| Why we chose X                      | `docs/DECISIONS.md`                                                                                |
| How a feature was planned           | `docs/plans/` (written by the build PR from the issue's plan comment)                              |
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

### CI: which check runs for which paths (issue #188)

Every check runs only when a changed file can change its result. `scripts/ci-paths.mjs` holds the rules; jobs (`storybook`, `build`, `e2e`, `db-reset`) use a scope job and an `if`, the other checks are `if`-gated steps of the `quality` job. A skipped job or step reports success, so the required check names never disappear; the `quality` job summary lists each skipped step. Pull requests and pushes to `main` use the same diff (`origin/<base>...HEAD`, `before..sha`); prettier and eslint check the changed files and Turborepo runs `--filter=...[ref]`. A change to `package.json`, `pnpm-lock.yaml` or `turbo.json` runs everything, and so does anything unknown (tag, first push, git error). A **nightly run** (03:00 UTC) of the Code quality workflow checks the whole repository as a safety net. Prettier, ESLint, typecheck and tests are not in the table: they follow the changed files and the packages that depend on them. `.turbo` is cached between runs.

The table is generated: `node scripts/ci-paths.mjs --write-table && pnpm prettier --write docs/WORKFLOW.md` (`pnpm docs:check` fails when it is stale). The staging deploy still runs on every merge to `main` (decision [188](decisions/188-ci-scoping.md)).

<!-- ci-table:start (generated by scripts/ci-paths.mjs --write-table) -->

| Check       | Kind             | Runs when a changed file is                                                                                             | Skipped for                                                                                                     |
| ----------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `storybook` | job              | `packages/ui/**`, `quality.yml`, root toolchain files                                                                   | everything else                                                                                                 |
| `docker`    | job (`build`)    | `apps/web/**`, `packages/**` (engine included: the web app imports it), `.dockerignore`, `.github/ci.env`, `docker.yml` | tests, stories, snapshots, `*.md`, `packages/test-fixtures/`, `packages/engine/{scripts,**/*.snap,**/*.svg}`    |
| `e2e`       | job              | `apps/web/**`, `packages/{ui,api,config,schemas,utils}/**`, `supabase/**`, `ci.env`, `e2e.yml`                          | unit tests, stories, snapshots, `*.md`, engine-only schema files (`pattern*.ts`, `engine-options*.ts`, `json/`) |
| `supabase`  | job (`db-reset`) | `supabase/**`, the Supabase adapter of the API, `supabase.yml`                                                          | everything else                                                                                                 |
| `api`       | quality step     | `packages/{api,schemas,config}/**`, `postman/**`, the OpenAPI and Postman scripts                                       | tests, `*.md`, everything else                                                                                  |
| `jscpd`     | quality step     | source under `apps/**` or `packages/**`, `.jscpd.json`, `.jscpd.json`, `.dependency-cruiser.cjs`, `quality.yml`         | tests, stories, snapshots, `*.md`, `docs/**`, `scripts/**`                                                      |
| `depcruise` | quality step     | source under `apps/**` or `packages/**`, `.jscpd.json`, `.dependency-cruiser.cjs`, `quality.yml`                        | tests, stories, snapshots, `*.md`, `docs/**`, `scripts/**`                                                      |
| `docs`      | quality step     | `docs/**`, `**/*.md`, any `package.json`, `scripts/{check-handbook,learning-log-index}.mjs`, `quality.yml`              | code-only changes                                                                                               |
| `tokens`    | quality step     | `packages/ui/**`, `docs/design-system/**`, `apps/web/src/**/*.css`, the token scripts, `quality.yml`                    | everything else                                                                                                 |
| `scripts`   | quality step     | `scripts/**`, `.github/**`, `docs/handbook/**`, `docs/design-system/**`, `quality.yml`                                  | app and package code                                                                                            |

<!-- ci-table:end -->

## 8. GitHub board and milestones

Board: **Tafsila** project (`merna550`, project #4). Columns: Backlog → Ready → In progress → In review → Done.
The workflow `.github/workflows/board-sync.yml` moves the card from the `status:*` label (and on close/merge); it needs the secret `PROJECT_TOKEN` (a token with the `project` scope, because the board is user-owned). By hand: `scripts/gh-project.sh add <url> [column]` and `status <url> <column>` (needs `gh auth refresh -s project` once); in cloud sessions it is a no-op because GraphQL is blocked there.
Acceptance criteria: `scripts/gh-ac.sh list|check|uncheck|progress <issue> [n…]` reads and ticks the `## Acceptance criteria` checkboxes in the issue body, through the REST API only (works where GraphQL is blocked). `/build` ticks, `/review` and `/ship` require N/N, `/status` shows `x/y criteria`.

| Status label                                               | Board column | Set by                       |
| ---------------------------------------------------------- | ------------ | ---------------------------- |
| `status:triage`, `status:needs-plan`, `status:plan-review` | Backlog      | `/triage`, `/plan`           |
| `status:ready`                                             | Ready        | `/triage` or `/plan`         |
| `status:in-progress`, `status:changes-requested`           | In progress  | `/build`                     |
| `status:in-review` (issue) and its PR                      | In review    | `/build`                     |
| closed / merged                                            | Done         | `board-sync.yml` (automatic) |

Every issue and its PR carry the same milestone. Each active milestone has a one-page brief in [docs/milestones/](milestones/README.md). Rule: write the next milestone's brief when the current one is about 70% done. `/plan-milestone M<n>` (Opus, once per milestone) writes the brief and drafts its issues as `status:plan-review` in Backlog; `/plan-wave` (Opus, with Merna present) then plans every `needs-plan` issue whose dependencies are all closed, in one session, posts each plan on its issue (comment only: no plan file, branch or PR; the build PR commits `docs/plans/<N>-<slug>.md`), gives Merna one short Arabic summary of the decisions, and after she replies "approved" (or "approved except #N") sets them to `status:ready`. Milestone map (SRS §12; titles match GitHub exactly):

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
