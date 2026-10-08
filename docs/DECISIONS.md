# Decision log

Newest first. Each entry: date · decision · reason · alternatives considered. Agents read this before asking questions.

## ADR-025 · 2026-10-08 · Observability: Sentry and PostHog wired through wrappers, runtime browser config, request id

**Decision:** (1) Browser config is read at runtime: the root layout calls `loadPublicConfig()` (`packages/config`) and passes `{ sentryDsn, posthogKey, posthogHost, appEnv, release }` to one client component, instead of build-time `NEXT_PUBLIC_*`, so one build runs in every environment (ADR-004). The DSN and project key are public by design. (2) API errors reach Sentry through an `ErrorReporter` port (Sentry and no-op adapters) because Hono's `onError` swallows errors before Next's `onRequestError`; a server-side `Analytics` port (PostHog and no-op adapters) exists for backend events. (3) New request-id middleware (reuse a safe inbound `x-request-id`, else a UUID); the id is in the response header, the 500 log line, the Sentry tag `request_id` and an additive `request_id` field of the error body. (4) Privacy (NFR-05): PostHog uses `persistence: "memory"`, no autocapture, no session recording, `person_profiles: "identified_only"`; Sentry collects no user info, cookies, headers or bodies and a `beforeSend` scrubber keeps only the opaque user id; event schemas in `packages/schemas` are `.strict()`. (5) `GET /api/debug/error` exists only when `APP_ENV` is not production and is throttled to one error a minute per instance (free quota). (6) Source maps are uploaded only by the staging CI build (`SENTRY_AUTH_TOKEN` never goes to Vercel); preview stacks stay minified. (7) `SENTRY_DSN` and `POSTHOG_KEY` are required in production only. (8) The PostHog project is in the US region (`https://us.i.posthog.com`); regions cannot change, so EU vs US is revisited with the M8 privacy policy. (9) `@sentry/nextjs` and `@sentry/node` are pinned to the same version (11.6.0) so there is one Sentry client; in v11 the `sendDefaultPii` option is replaced by `dataCollection` and `withSentryConfig` is imported from `@sentry/nextjs/config`. (10) `.dependency-cruiser.cjs` rules `analytics-via-wrapper` and `sentry-via-wrappers`; its `exclude` was widened from the bare word `dist` to project `dist` and `.next` folders, because it hid every import that resolved into a package `dist/` folder (such as `posthog-js`).
**Reason:** NFR-09 and M0 exit criterion 3; keeps vendors swappable and personal data out of events. Free tiers only (ADR-022): Sentry Developer, PostHog Free with the billing limit at $0.
**Alternatives:** `NEXT_PUBLIC_*` variables (inlined at build, breaks build once / run anywhere); relying on `onRequestError` for API errors (never sees Hono-handled errors); EU PostHog region (the project was already created in US); cookies and session recording now (needs the M8 consent work).

## ADR-024 · 2026-10-08 · M0–M1 product decisions: name, size range, OTP channel, ease preference, mini admin

**Decision:** (1) The name stays Tafsila / تفصيلة; the domain moves from M0 to M8 (landing page), and staging and early production use Vercel URLs (fits ADR-022). (2) Standard sizes are S–XXL for the MVP; anyone outside uses custom measurements, and more sizes later are data only (the admin size-chart editor, no code). (3) The production OTP channel (SMS via Twilio/Vonage/MessageBird, or WhatsApp) is decided at M8 by comparing per-message prices; dev, staging and beta-prep use test numbers. (4) Ease preference (FR-MEAS-06) moves from M1 to M3 because it is chosen per pattern. (5) The mini admin (users list and size-chart editor) stays in M1. Process: each milestone gets a one-page brief in `docs/milestones/`, written with `/plan-milestone` (Opus, once per milestone, when the previous one is ~70% done); `/plan-wave` then plans every needs-plan issue whose dependencies are closed, in one Opus session with Merna present.
**Reason:** Pre-revenue project, no paid plans before the beta; the size chart is data so the range can grow without code; ease is meaningless before a pattern exists; agents must not re-ask these questions.
**Alternatives:** XS–XXXL (more rows to compile and sew-test before launch); buying the domain now (paid, ADR-022); picking the OTP provider now (price unknown, only matters from the beta); keeping ease in M1 (nothing to apply it to).

## ADR-023 · 2026-10-08 · Staging: Vercel previews from Git, `main` deployed by CI after the migrations, Supabase Free

**Decision:** (1) One Vercel project on Hobby is the staging project: its Production target is staging (`main`), its Preview target is PR previews; custom environments need Pro. Real production gets its own project at M8. (2) Previews come from the Vercel Git integration; `main` is deployed by `.github/workflows/staging.yml` (`vercel.json` sets `git.deploymentEnabled.main` to false), in the order migrate, deploy, smoke check of `/api/health` (environment and git SHA). (3) Supabase staging runs on the Free plan until the beta (it pauses after 7 idle days; wake it from the dashboard). Previews share the staging database with `APP_ENV=preview`. This supersedes the Supabase sentence of ADR-014 ("staging needs Pro"); the Vercel part of ADR-014 still applies at M8. (4) Migrations reach staging only from CI (`supabase db push`, never the seed) and stay backward compatible for one release; PR migrations are proven by `supabase.yml`. (5) Secrets and variables are repository-level with a `_STAGING` suffix (ADR-022), and the job uses `concurrency: staging` instead of an environment lock. (6) Test OTP numbers reach staging through a `[remotes.staging]` block that the `migrate` job appends to `supabase/config.toml` at runtime (real ref from `vars.SUPABASE_PROJECT_REF_STAGING`) before `supabase config push`; the block is not committed because the Supabase CLI validates `remotes.*.project_id` on every command and fails when the variable is unset (e.g. the `db-reset` CI job); fallback is setting the same numbers in the dashboard.
**Reason:** Deploying `main` from the Git integration would race the migration; CLI deploys from CI give one ordered, verifiable pipeline on free tiers. `/api/health` reporting the SHA proves the merged commit is what runs.
**Alternatives:** Vercel Pro custom environments (paid, ADR-022); GitHub environment secrets (paid for private repos); letting the Vercel Git integration deploy `main` (races the migration); applying PR migrations to staging before merge (breaks previews of other PRs).

## ADR-022 · 2026-10-08 · Free tiers only until the beta (M8)

**Decision:** No paid plan and no payment method on any service until the beta (milestone M8). Everything stays on free tiers: Vercel Hobby, Supabase Free, GitHub Free (Actions free minutes). Spending limits stay at $0 where a service has them, so a quota overrun fails instead of billing. If any step would need a paid plan, a paid add-on or a payment method, the agent stops, adds `needs:decision` and asks Merna one question; a free alternative that is cheap to reverse is chosen and logged instead of stopping. First consequence (issue #19): staging secrets are repository-level Actions secrets with a `_STAGING` suffix, because environment secrets in private repositories need GitHub Pro or Team. The Vercel GitHub integration (free) is allowed for preview deployments.
**Reason:** Pre-revenue project; costs are only worth paying once users pay. A hard rule avoids surprise bills from agents choosing a convenient paid feature.
**Alternatives:** Pay as needed (no control over agent choices); Vercel Pro and Supabase Pro now (about $45 per month with no users); GitHub Pro for environment secrets (paid, and repository secrets are enough for one remote environment). ADR-014 still applies at M8.

## ADR-021 · 2026-10-07 · Local Supabase: test OTP, dummy SMS provider, AI and Paymob optional until their milestone

**Context:** Every developer and cloud agent needs a full local backend with no accounts (issue #18).
**Decision:** `supabase/config.toml` is committed. Phone auth is on with three test numbers (`+201000000001..3`, code `123456`); GoTrue refuses phone sign-in with no provider, so a dummy Twilio entry is enabled (never called; real credentials come from env vars per environment). Email confirmations are on and land in the local mail catcher. Google is declared but disabled. Private bucket `design-photos`. `AI_*` and `PAYMOB_API_KEY` are optional in `packages/config/env.ts` and required only when `APP_ENV=production`. `db:types` writes `database.types.ts`. CI job `supabase.yml` runs `db:reset` on a fresh stack, skipping studio, edge runtime and analytics.
**Alternatives:** A remote dev project (cost, accounts, not offline); requiring AI keys everywhere (blocks CI and staging until M6).

## ADR-020 · 2026-10-07 · The dispatcher starts on events, with a 6-hour cron as a safety net

**Context:** A 2-hour cron left ready work waiting up to 2 hours and mostly ran with nothing to do (issue #50).
**Decision:** `dispatch.yml` also starts when an issue gets `status:ready`, `status:in-review` or `status:blocked`, when an issue is closed, and when a PR is closed (these add work or free a slot); other label events skip `select`. The cron is every 6 hours, only to catch missed events. All guards stay (one in progress, 3 waiting PRs, `DISPATCH_DAILY_LIMIT`, `DISPATCH_ENABLED`), and the `dispatch` concurrency group collapses bursts into one pending run. Label changes made with the default `GITHUB_TOKEN` start no workflows; agents use `AGENT_GITHUB_TOKEN`, so theirs do.
**Alternatives:** Keep the 2-hour cron (slow, idle runs); chain on the dispatcher's own completion via `workflow_run` (loops when nothing is ready).

## ADR-019 · 2026-10-07 · `/build` and `/plan` delegate to a subagent pinned to the label's model

**Context:** The model came from whoever started the session (`--model`, `/model`), so a `build:haiku` issue could run on opus and the reverse (issue #40).
**Decision:** `scripts/agent-model.mjs` maps `build:*` / `plan:*` to a model and a subagent (`builder-haiku|sonnet|opus`, `planner-sonnet|opus`); missing or unknown label → sonnet with a note; `plan:none` → skip. `/build` and `/plan` only resolve the label, start that subagent and relay its summary; the steps moved to `.claude/procedures/build.md` and `plan.md`. Subagent files omit `tools`, so they inherit every tool including the GitHub MCP tools that cloud sessions use when `gh` is missing, and set `maxTurns: 50` because the CLI's `--max-turns` caps only the main session. `claude.yml` resolves the model with the same script; an `@claude` comment on a PR uses the PR's linked issue (closing reference, else `Closes|Fixes|Resolves #N` in the body). The project default model is `sonnet` in `.claude/settings.json`. `dispatch.mjs` reuses the same resolver.
**Alternatives:** Keep choosing `--model` per session (error-prone, the bug this fixes); one subagent with a model passed at call time (the Agent tool's model override is not available in every surface, and the label rule would live only in prose).

## ADR-018 · 2026-10-07 · Reusable workflows detect the caller by inputs, not `github.event_name`

**Context:** The dispatcher picked #18 but `build / claude` was skipped (issue #38): `claude.yml` checked `github.event_name == 'workflow_call'`, but in a called workflow `github.event_name` is the caller's event (`schedule`, `workflow_dispatch`).
**Decision:** `claude.yml` detects a dispatcher call by its required `issue` input (`inputs.issue != ''`). `dispatch.yml` has a `dry_run` input for manual runs that prints the pick and skips Claude. `scripts/workflows.test.mjs` parses the workflow YAML and guards these conditions. `actions/checkout` and `actions/setup-node` are on v5 (Node 24 runtime). setup-node v5 caches the `packageManager` from `package.json` (pnpm) by itself, so jobs that do not run `pnpm/action-setup` first set `package-manager-cache: false` (issue #42; a test guards it). Workflow values that contain ` #` are quoted, because YAML reads the rest as a comment (the dispatcher prompt lost its issue number, issue #44). Headless Claude Code refuses tools that are not allowed up front, so `claude.yml` passes `--allowedTools` (Bash, file edits, search, Agent for the builder subagents, skills); a last step fails the job when the transcript shows a refused tool, because the action itself reports success (issue #46). `/build` and `/plan` start their subagent in the foreground, because a headless run ends with the main turn and cuts a background subagent off; `claude.yml` keeps the transcript as a 7-day `claude-transcript` artifact (issue #48).
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
