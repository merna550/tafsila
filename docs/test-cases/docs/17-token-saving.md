# Test cases — Token-saving agent setup and cloud cost guards

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #17                        |
| SRS          | NFR-12                     |
| Area         | infra                      |
| Last updated | 2026-10-07 (by PR for #17) |

## Test data

A checkout with dependencies installed (`pnpm install`) and `origin/main` fetched. For the cloud cases, the secrets from the [cloud agents tutorial](../../backend/tutorials/run-agents-in-cloud.md).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                                         | Priority | Preconditions                     | Steps                                                                                                                                                                    | Expected result                                                                        | Automated by                            | dev | staging |
| -------------- | --------------------------------------------- | -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | --------------------------------------- | --- | ------- |
| TC-INFRA-17-01 | Format hook fixes a badly formatted file      | High     | Claude Code session in the repo   | Write `export const  a = 1` to a new `.mjs` file under `scripts/` (in a session, or pipe `{"tool_input":{"file_path":"<file>"}}` into `scripts/hooks/format-changed.sh`) | File is saved as `export const a = 1;` with no extra agent turn and no hook output     | manual only                             | ✅  | ⬜      |
| TC-INFRA-17-02 | Format hook reports remaining lint errors     | High     | As above                          | Same, with an unused variable                                                                                                                                            | Agent sees at most 30 lines naming the rule (`no-unused-vars`), exit code 2            | manual only                             | ✅  | ⬜      |
| TC-INFRA-17-03 | Stop hook checks affected packages only       | High     | A type error in `packages/utils`  | Pipe `{"stop_hook_active":false}` into `scripts/hooks/verify-affected.sh`                                                                                                | Only `@tafsila/utils` runs; short summary with the TS error; exit code 2               | manual only                             | ✅  | ⬜      |
| TC-INFRA-17-04 | Stop hook does not loop                       | Medium   | Same type error                   | Pipe `{"stop_hook_active":true}` into the hook                                                                                                                           | Exit code 0 with a `systemMessage` warning                                             | manual only                             | ✅  | ⬜      |
| TC-INFRA-17-05 | Stop hook is instant with no changes          | Medium   | Clean branch equal to main        | Run the hook                                                                                                                                                             | Exit code 0 in about a second, no output                                               | manual only                             | ✅  | ⬜      |
| TC-INFRA-17-06 | Subagents exist on haiku                      | High     | none                              | Run `/agents` in Claude Code                                                                                                                                             | `code-search` and `test-runner` are listed with model haiku                            | manual only                             | ⬜  | ⬜      |
| TC-INFRA-17-07 | PR CI is affected-only, main runs everything  | High     | A PR that changes one package     | Open the Code quality run; then the run on `main` after merge                                                                                                            | PR: filter `...[origin/main]` and only changed files linted. `main`: full lint/tests   | `scripts/ci-scope.sh` (checked by hand) | ✅  | ⬜      |
| TC-INFRA-17-08 | Root config change checks everything on a PR  | Medium   | PR touching `turbo.json`          | Run `bash scripts/ci-scope.sh pull_request main`                                                                                                                         | `filter=` (empty) and `lint_files=all`                                                 | manual only                             | ✅  | ⬜      |
| TC-INFRA-17-09 | Dispatcher daily limit                        | High     | none                              | Run `pnpm test:docs`                                                                                                                                                     | After `DISPATCH_DAILY_LIMIT` builds today (default 4) nothing starts; reason printed   | `scripts/dispatch.test.mjs`             | ✅  | ⬜      |
| TC-INFRA-17-10 | Action stops after 50 turns                   | Medium   | Secrets set                       | Read the "Claude agent" run log of a build                                                                                                                               | `claude_args` contains `--max-turns 50`                                                | manual only                             | ⬜  | ⬜      |
| TC-INFRA-17-11 | Unattended agent stops after two failures     | Medium   | Ready issue with an impossible AC | Let the dispatcher build it                                                                                                                                              | Agent comments the problem, sets `status:blocked`, does not change the `build:*` label | manual only                             | ⬜  | ⬜      |
| TC-INFRA-17-12 | agent-setup prints one line and logs the rest | High     | `CLAUDE_CODE_REMOTE=true`         | Run `bash scripts/agent-setup.sh`                                                                                                                                        | One `agent-setup: ready (...)` line with the log path; full output in the log file     | manual only                             | ✅  | ⬜      |

## Manual run log

| Date       | Env                  | Tester | Result | Notes                                                                                                                                                                   |
| ---------- | -------------------- | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-07 | claude.ai/code cloud | agent  | Pass   | 01–05, 07–09, 12 run by hand (hook scripts fed hook JSON on stdin; a live session check is still open); 12 showed "engines check relaxed" (cloud Node 22.22.0, ADR-017) |
