# Plan #16: Run issues in the cloud while the laptop is off

Issue: #16 · plan:none · build:sonnet · Milestone: M0 - Foundation & environments

The issue body is the plan (`plan:none`). What was done:

1. **SessionStart hook:** `.claude/settings.json` runs `scripts/agent-setup.sh`. The script exits at once unless `CLAUDE_CODE_REMOTE=true`, then runs `corepack enable` and `pnpm install --frozen-lockfile`. The Supabase CLI is the root devDependency `supabase` (used through the `db:*` scripts), not a global install.
2. **`.github/workflows/claude.yml`:** `anthropics/claude-code-action`, triggers `issue_comment` / `pull_request_review_comment` (only `merna550`, only with `@claude`) and `workflow_call`. Auth: `CLAUDE_CODE_OAUTH_TOKEN` and `github_token` = `AGENT_GITHUB_TOKEN`. Model from the `build:*` label, prompt `/build #N`, concurrency per issue, 60 minute timeout.
3. **Dispatcher:** `.github/workflows/dispatch.yml` (every 2 hours, `workflow_dispatch`, pause with `DISPATCH_ENABLED=false`, `DISPATCH_MAX_PARALLEL`) calls `claude.yml` via `workflow_call`. Selection is the pure function in `scripts/dispatch.mjs`, tested in `scripts/dispatch.test.mjs`.
4. **Docs:** tutorial `docs/backend/tutorials/run-agents-in-cloud.md`, WORKFLOW section 2, `claude-code.md` card, ADR-016, SRS NFR-12, glossary (dispatcher, fine-grained personal access token, SessionStart hook), learning log.

## Needs Merna (cannot be done by the agent)

`/web-setup`, the two secrets, the claude.ai/code environment, and the end-to-end test from the cloud with the laptop closed.

## Verification

`pnpm quality && pnpm test` green; dispatcher unit tests cover priority, dependencies, `needs:decision`, parallel limit, 3-PR limit and pause.
