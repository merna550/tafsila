# Decision log

Newest first. Each entry: date · decision · reason · alternatives considered. Agents read this before asking questions.

## ADR-019 · 2026-10-07 · `/build` and `/plan` delegate to a subagent pinned to the label's model

**Context:** The model came from whoever started the session (`--model`, `/model`), so a `build:haiku` issue could run on opus and the reverse (issue #40).
**Decision:** `scripts/agent-model.mjs` maps `build:*` / `plan:*` to a model and a subagent (`builder-haiku|sonnet|opus`, `planner-sonnet|opus`); missing or unknown label → sonnet with a note; `plan:none` → skip. `/build` and `/plan` only resolve the label, start that subagent and relay its summary; the steps moved to `.claude/procedures/build.md` and `plan.md`. Subagent files omit `tools`, so they inherit every tool including the GitHub MCP tools that cloud sessions use when `gh` is missing, and set `maxTurns: 50` because the CLI's `--max-turns` caps only the main session. `claude.yml` resolves the model with the same script; an `@claude` comment on a PR uses the PR's linked issue (closing reference, else `Closes|Fixes|Resolves #N` in the body). The project default model is `sonnet` in `.claude/settings.json`. `dispatch.mjs` reuses the same resolver.
**Alternatives:** Keep choosing `--model` per session (error-prone, the bug this fixes); one subagent with a model passed at call time (the Agent tool's model override is not available in every surface, and the label rule would live only in prose).

## ADR-018 · 2026-10-07 · Reusable workflows detect the caller by inputs, not `github.event_name`

**Context:** The dispatcher picked #18 but `build / claude` was skipped (issue #38): `claude.yml` checked `github.event_name == 'workflow_call'`, but in a called workflow `github.event_name` is the caller's event (`schedule`, `workflow_dispatch`).
**Decision:** `claude.yml` detects a dispatcher call by its required `issue` input (`inputs.issue != ''`). `dispatch.yml` has a `dry_run` input for manual runs that prints the pick and skips Claude. `scripts/workflows.test.mjs` parses the workflow YAML and guards these conditions. `actions/checkout` and `actions/setup-node` are on v5 (Node 24 runtime).
**Alternatives:** Pass a `caller` input (redundant with `issue`); test with `act` locally (heavy, needs Docker, not in CI).

· 2026-10-07 · Token-saving agent setup and cloud cost guards

**Decision:** (1) **Hooks** in `.claude/settings.json`: PostToolUse on Edit/MultiEdit/Write runs `scripts/hooks/format-changed.sh` (Prettier + `eslint --fix` on that one file; silent when clean, otherwise at most 30 lines of remaining errors, exit 2 so the agent sees them). Stop runs `scripts/hooks/verify-affected.sh`: `turbo run typecheck test --filter=...[origin/main]` plus the `scripts/` tests when `scripts/` changed; on failure it returns a short summary and blocks the stop once; if the agent was already sent back by this hook and it still fails, the stop is allowed with a warning for the person, so a problem the agent cannot fix never loops. `turbo.json` `globalDependencies` (`tsconfig.base.json`, `.nvmrc`) make root config changes count for every package. (2) **Subagents** in `.claude/agents/` on haiku: `code-search` (Read/Grep/Glob only) and `test-runner` (returns only failures). (3) **CI:** Code quality now also runs on pushes to `main`, and runs tests (it did not before). On PRs, lint covers only changed source files and typecheck/test use `--filter=...[origin/<base>]` (`scripts/ci-scope.sh`); a PR that changes root config (lockfile, workspace, turbo, tsconfig, ESLint config, `.nvmrc`) checks everything. Format, duplicate, architecture and handbook checks stay whole-repo (they are fast). Turbo remote cache: optional, not enabled. (4) **`docs/CONTEXT_MAP.md`:** files to read per task type. (5) **Cloud cost guards:** `--max-turns 50` in `claude.yml`; the dispatcher starts at most `DISPATCH_DAILY_LIMIT` builds per UTC day (default 4; counted from today's dispatcher runs whose build job was not skipped); the **unattended rule**: in GitHub Actions or a cloud session, the same problem failing twice means stop, comment on the issue, `status:blocked`, never escalate the model alone. `scripts/agent-setup.sh` logs to a file and prints one line; it now also runs in GitHub Actions (`GITHUB_ACTIONS=true`, where `claude.yml` calls it and nothing was installed before) and, when the image's Node 22 patch is below the `engines` pin, retries the install with only the engines check relaxed and says so in its summary line.
**Reason:** Tokens and Actions minutes should go to the feature, not to formatting, exploring the repo or reading long logs; unattended runs need hard stops so a stuck agent cannot burn the subscription. The cloud image shipped Node 22.22.0 while `engines` asks for >=22.22.2, so the SessionStart install failed and every cloud session started without dependencies.
**Alternatives:** Run the full `pnpm quality && pnpm test` in the Stop hook (minutes per stop); lint every PR in full (slow as the repo grows); a Turbo filter per lint task (ESLint runs from the root with one config, so per-package lint tasks would duplicate it); counting builds with a label or a file (more state to keep correct); failing setup on the Node patch mismatch (no dependencies at all in the cloud) or lowering the pin (it is a deliberate minimum, ADR-014).

## ADR-016 · 2026-10-07 · Cloud agents without the Claude GitHub App

**Decision:** Issues can be built while the laptop is off in two ways, with **no Claude GitHub App** installed: (1) Claude Code on the web (claude.ai/code, connected once with `/web-setup`); (2) `.github/workflows/claude.yml` (`anthropics/claude-code-action`) triggered by `@claude` comments from Merna only and by `workflow_call` from `.github/workflows/dispatch.yml`. The dispatcher runs every 2 hours, runs `scripts/dispatch.mjs` and picks the highest-priority `status:ready` issue whose "Depends on" issues are closed and that has no `needs:decision`. It starts nothing while an issue is in progress (`DISPATCH_MAX_PARALLEL`, default 1; a second one only in a different `area:*`), nor when 3 or more non-draft PRs wait for review, and it is paused with the repo variable `DISPATCH_ENABLED=false`. The model comes from the `build:*` label. Claude auth is the subscription token `CLAUDE_CODE_OAUTH_TOKEN`; GitHub auth is `AGENT_GITHUB_TOKEN`, a fine-grained personal access token limited to this repo (contents, pull requests, issues: read/write) that expires after 90 days. Auto-fix on PRs needs the App, so it is not used.
**The SessionStart hook:** `.claude/settings.json` runs `scripts/agent-setup.sh` when a session starts. Why it is safe: (1) it exits immediately unless `CLAUDE_CODE_REMOTE=true`, which only cloud sessions set, so it never runs on a developer laptop; (2) it only runs `corepack enable` and `pnpm install --frozen-lockfile`, so it installs exactly what the lockfile pins; (3) no global installs (the Supabase CLI is the root devDependency `supabase`, run through `pnpm exec`/the `db:*` scripts); (4) it reads and prints no secrets; (5) it is a visible file in the repo, reviewed in the PR like any code; (6) it is idempotent and has a 300 s timeout.
**Reason:** Work continues with the laptop off, at no extra paid service. A personal token is needed because PRs opened with the default `GITHUB_TOKEN` do not trigger CI. One issue at a time and the 3-PR limit keep review load and Actions minutes low.
**Alternatives:** Install the Claude GitHub App (rejected by Merna); API key instead of the subscription token (more cost, another secret); label-triggered builds (label events made with the workflow token do not start other workflows); installing the Supabase CLI globally in the hook (unpinned, runs on laptops too).

## ADR-015 · 2026-10-07 · The handbook is enforced by CI (`docs:check`) and a PR rule

**Decision:** `pnpm docs:check` (`scripts/check-handbook.mjs`) fails when a direct dependency of any workspace `package.json` is not listed in some technology card's `packages:` front matter, or when a relative link or anchor in `docs/` does not resolve. It is part of `pnpm quality` and the Code quality workflow. Card front matter is parsed as real YAML with the `yaml` package (Prettier can reflow the list; a one-line regex would miss it). External links are checked by lychee (`.github/workflows/docs-links.yml`) on PRs touching `docs/**` (non-blocking) and weekly (opens an issue on failure). Every PR has a "Concepts introduced" section and a Definition of Done item.
**Reason:** Agents add libraries and terms every week; a handbook that depends on reviewers remembering goes stale. Cards may list planned, not-yet-installed packages, so the check only requires installed dependencies to be covered.
**Alternatives:** Regex front matter parsing (fragile); a docs site with a built-in checker (premature); making external link failures block merges (other sites go down; not our fault).

## ADR-014 · 2026-10-07 · Vercel Pro and the Node 22 pin must be revisited before launch

**Decision:** Record two dated findings from the tech-card fact check (issue #9): (1) the Vercel Hobby plan is restricted to non-commercial, personal use, so the production project moves to Vercel Pro (about $20 per developer seat per month) before the first paying user (milestone M8 at the latest); development and previews may stay on Hobby while there is no revenue. (2) Node 22 is in Maintenance LTS until 2027-04-30; move `.nvmrc`, `engines` and the Dockerfile to Node 24 (or 26) by mid 2027. Supabase staging/production projects also need Pro (free projects pause after a week of inactivity).
**Reason:** Using a free plan against its terms, or running an unsupported Node version, are avoidable launch risks. Both costs are small and known in advance.
**Alternatives:** Stay on Hobby (violates the plan terms once we charge); host the Docker image elsewhere (more operations work; remains the exit path, [ADR-004](#adr-004--2026-10-06--docker-images-for-portability-and-production-like-testing)). Money decision: Merna confirms the Pro upgrade at M8.
**Sources:** [Vercel Hobby plan](https://vercel.com/docs/plans/hobby), [Node.js release schedule](https://github.com/nodejs/Release/blob/main/schedule.json), [Supabase pricing](https://supabase.com/pricing) (all checked 2026-10-07).

## ADR-013 · 2026-10-07 · Tooling and quality gates

**Decision:** pnpm workspaces + Turborepo; Vitest (with fast-check for engine properties) and Playwright for tests; ESLint (jsdoc, sonarjs, import-x, typescript-eslint) + Prettier for style; jscpd for duplication; dependency-cruiser for architecture; Husky + lint-staged locally and the same checks in CI. Details in the tech cards under `docs/handbook/tech/`.
**Reason:** Agents write most code, so every rule in CODING_STANDARDS must be checked by a tool, with fast local feedback and CI as the final gate.
**Alternatives:** npm/Yarn, Nx, Jest, Cypress, Biome (fewer plugins for our JSDoc and complexity rules), review-only enforcement.

## ADR-012 · 2026-10-07 · Background jobs, payments and data access

**Decision:** Inngest for background jobs (AI analysis, PDF, nesting) behind a `JobQueue` port; Paymob (cards, wallets, kiosk cash) behind a `PaymentGateway` port, Stripe is not available to Egypt-based merchants; Postgres (via Supabase) for transactional data, accessed through Drizzle in repository adapters (to be confirmed by a spike when the first repository is built in M1).
**Reason:** No queue servers to run alone; local payment methods are required in Egypt; money and versions must change atomically.
**Alternatives:** BullMQ + Redis, Trigger.dev, QStash, Kafka; Stripe, PayPal; MongoDB; Prisma or raw SQL.

## ADR-011 · 2026-10-07 · Frontend stack

**Decision:** Next.js App Router + React, Tailwind CSS with logical properties for RTL, shadcn/ui components copied into `packages/ui`, TanStack Query for server data, Zustand for the editor session only, next-intl for Arabic (default) and English, React Hook Form + Zod for forms.
**Reason:** Server rendering and SEO for Arabic pages, one deploy for UI and API, accessible components we own, RTL without mirrored CSS.
**Alternatives:** Vite SPA + separate API, Remix, Astro, Nuxt/SvelteKit; MUI/Chakra; CSS-in-JS; Redux; react-i18next.

## ADR-010 · 2026-10-07 · Handbook: link to the docs, never duplicate them

**Decision:** `docs/handbook/` explains terms, technologies and patterns in plain English and links to SRS, ARCHITECTURE, CODING_STANDARDS, DECISIONS and WORKFLOW, which stay the source of truth. Things that are designed but not built yet are marked "planned" with the SRS or ADR reference. Glossary entries named a technology card as plain text until it existed; issue #9 replaced them with links.
**Reason:** One source of truth per fact; the handbook cannot drift into a second, conflicting spec; every relative link can be checked.
**Alternatives:** Copy rules into the handbook (drifts); wait for tech cards before writing the glossary (blocks the core pages).

## ADR-009 · 2026-10-07 · MVP milestone plan v2; 3D deferred to post-launch

**Decision:** Delivery is planned in 10 milestones, `M0 - Foundation & environments` … `M9 - Public launch`, plus `Post-launch` (SRS §12, WORKFLOW §8; titles identical to GitHub). The simplified 3D assembly preview (FR-3D-01…04, priority "Should") moves to `Post-launch`; the engine still outputs the sewing order (FR-PAT-06). Acceptance-criteria progress is tracked by ticking the issue checkboxes with `scripts/gh-ac.sh`.
**Reason:** Smaller milestones with checkable exit criteria; accounts/data and the manual design UI come before AI so the product is usable early; 3D is not needed to launch and was the largest risk in the old M5. Ticked criteria make progress visible on the issue and the board.
**Alternatives:** Keep the 7-milestone plan (milestones too large, 3D on the critical path); track progress only by open/closed issues (no view inside an issue).

## ADR-008 · 2026-10-07 · Per-area agent configuration

**Decision:** Agent instructions are split by area: root `CLAUDE.md` for project-wide rules, nested `CLAUDE.md` in `apps/web`, `packages/api` and `packages/engine` (loaded only when those files are touched), path-scoped rules in `.claude/rules/**` (`paths:` frontmatter), and task skills in `.claude/skills/` that link to the existing tutorials instead of repeating them.
**Reason:** Agents load only the rules for the files they edit (fewer tokens, less noise), and common tasks follow one fixed procedure that ends with the Definition of Done.
**Alternatives:** One large root `CLAUDE.md` (loaded every session, grows without bound); slash commands only (no automatic loading by path).

## ADR-007 · 2026-10-07 · Do not pin Alpine apk package versions

**Decision:** `apk add` in Dockerfiles stays unpinned (hadolint DL3018 ignored on its own line); reproducibility comes from the pinned base image tag.
**Reason:** Alpine removes old package versions from its mirrors, so pinned versions break future builds.
**Alternatives:** Pin apk versions (builds break when mirrors drop them); Debian-slim base (bigger image).

## ADR-006 · 2026-10-07 · Architecture style per part

**Decision:** Modular monolith. Frontend: feature-sliced. API: hexagonal (ports & adapters) with a composition root. Engine: functional core with a plugin pipeline of feature modules. See docs/ARCHITECTURE.md.
**Reason:** Clear boundaries for a solo developer, vendor independence, deterministic and testable geometry, new garment features without touching existing ones.

## ADR-005 · 2026-10-07 · One monorepo; backend as a Hono package

**Decision:** Single repo. API lives in `packages/api` (Hono), mounted in Next.js at `/api`; can run standalone as `apps/api` later with no rewrite.
**Reason:** Shared engine and schemas, one PR per feature, one CI; backend stays independently deployable.
**Alternatives:** Separate frontend/backend repos (duplication, sync overhead); API inside Next.js route handlers (harder to extract later).

## ADR-004 · 2026-10-06 · Docker images for portability and production-like testing

**Decision:** Build a production-grade Docker image of the web app in CI (multi-arch, scanned, pushed to GHCR) and use Docker Compose for local services; Vercel remains the primary host.
**Reason:** One immutable image promoted across environments; prod-like local testing; exit plan from Vercel; required for the v2 Python simulation service.
**Alternatives:** Vercel-only (no portability); self-host from day one (more ops work for a solo founder).

## ADR-003 · 2026-10-06 · Managed services: Vercel + Supabase

**Decision:** Host on Vercel; Supabase for Postgres, Auth, Storage. External services behind adapters.
**Reason:** Free tiers, minimal ops, Postgres is portable.

## ADR-002 · 2026-10-06 · AI understands, engine draws

**Decision:** AI only produces/edits a validated DesignSpec; a deterministic TypeScript engine produces all geometry.
**Reason:** Millimetre accuracy, reproducibility, testability.

## ADR-001 · 2026-10-06 · TypeScript monorepo

**Decision:** TypeScript for web, API and engine (pnpm + Turborepo); Python only for the v2 simulation service.
**Reason:** One language for a solo developer; engine must run in the browser; FreeSewing is JavaScript.
