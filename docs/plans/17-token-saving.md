# Plan #17: Token-saving setup — hooks, cheap subagents, affected-only checks, context map, cloud cost guards

Issue: #17 · plan:none · build:sonnet · Milestone: M0 - Foundation & environments · Depends on #16 (merged)

The issue body is the plan (`plan:none`). What was done (ADR-017):

1. **Hooks** (`.claude/settings.json`):
   - PostToolUse (Edit/MultiEdit/Write) → `scripts/hooks/format-changed.sh`: Prettier + `eslint --fix` on the edited file only; silent when clean, else ≤ 30 lines of remaining errors (exit 2). Skips files outside the repo and in `node_modules`.
   - Stop → `scripts/hooks/verify-affected.sh`: `turbo run typecheck test --filter=...[origin/main]`, plus `vitest run scripts` when `scripts/` changed. Nothing changed against main → exits at once. Failure → short summary, exit 2 (blocks once); still failing on the second stop → allowed with a warning (no loop).
   - `scripts/hooks/read-hook-input.mjs` reads the hook JSON (no `jq` dependency); `turbo.json` `globalDependencies` so root tsconfig / Node changes affect every package.
2. **Subagents** `.claude/agents/code-search.md` (haiku, Read/Grep/Glob) and `.claude/agents/test-runner.md` (haiku, Bash/Read/Grep). Rule 8 in `CLAUDE.md`.
3. **CI** `quality.yml`: runs on PRs and on pushes to `main`; `scripts/ci-scope.sh` gives the turbo filter and the changed files to lint on PRs, everything on `main` or when root config changes. Adds the missing typecheck+test step. Turbo remote cache: note only.
4. **`docs/CONTEXT_MAP.md`**, linked from `CLAUDE.md`, `/plan`, `/build`, WORKFLOW section 2.
5. **Handbook:** glossary (affected build, context map, hook, subagent; dispatcher and SessionStart hook updated), `claude-code.md` "Saving tokens", `turborepo.md`, learning log.
6. **Cloud cost guards:** `--max-turns 50` in both `claude_args`; unattended rule in `/build`, `CLAUDE.md` rule 9 and WORKFLOW; `DISPATCH_DAILY_LIMIT` (default 4) in `scripts/dispatch.mjs` with unit tests; `agent-setup.sh` logs to a file and prints one line. `claude.yml` now sets up Node from `.nvmrc`, and `agent-setup.sh` also runs in Actions.

## Found while building

The cloud image has Node 22.22.0 but `engines` requires >=22.22.2 with `engine-strict=true`, so the SessionStart install failed. `agent-setup.sh` now retries with only the engines check relaxed and says so in its summary line.

## Needs Merna

After merge: set `DISPATCH_ENABLED` to `true` (or delete it), optionally `DISPATCH_DAILY_LIMIT`. Check the hooks in a real session (TC-INFRA-17-01/02).

## Verification

`pnpm quality && pnpm test` green; `vitest run scripts` covers the daily limit and hook input parsing; the hooks and `ci-scope.sh` were run by hand on good and bad files (see the test cases).
