# Test cases — Cloud agents

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #16                        |
| SRS          | NFR-12                     |
| Area         | infra                      |
| Last updated | 2026-10-07 (by PR for #42) |

## Test data

A repo with the secrets `CLAUDE_CODE_OAUTH_TOKEN` and `AGENT_GITHUB_TOKEN` set (see the [tutorial](../../backend/tutorials/run-agents-in-cloud.md)) and a small `status:ready` docs issue (XS).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                                    | Priority | Preconditions              | Steps                                                 | Expected result                                                         | Automated by                 | dev | staging |
| -------------- | ---------------------------------------- | -------- | -------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------- | --- | ------- |
| TC-INFRA-16-01 | Dispatcher picks by priority             | High     | none                       | Run `pnpm test:docs`                                  | Highest priority, then lowest number, is selected                       | `scripts/dispatch.test.mjs`  | ⬜  | ⬜      |
| TC-INFRA-16-02 | Dependencies and needs:decision skip     | High     | none                       | Run `pnpm test:docs`                                  | Blocked issues are never picked                                         | `scripts/dispatch.test.mjs`  | ⬜  | ⬜      |
| TC-INFRA-16-03 | Parallel and 3-PR limits, pause          | High     | none                       | Run `pnpm test:docs`                                  | Nothing starts when the limit or pause applies; reason is printed       | `scripts/dispatch.test.mjs`  | ⬜  | ⬜      |
| TC-INFRA-16-04 | Hook does nothing on a laptop            | High     | `CLAUDE_CODE_REMOTE` unset | Run `bash scripts/agent-setup.sh`                     | Exit code 0, no output, nothing installed                               | manual only                  | ⬜  | ⬜      |
| TC-INFRA-16-05 | Hook installs in a cloud session         | High     | New claude.ai/code session | Start a session; run `pnpm quality`                   | Dependencies installed under 5 minutes; quality passes                  | manual only                  | ⬜  | ⬜      |
| TC-INFRA-16-06 | `@claude` from Merna builds and opens PR | High     | Secrets set                | Comment `@claude` on a ready XS issue                 | PR opened, linked to the issue, CI runs on it                           | manual only                  | ⬜  | ⬜      |
| TC-INFRA-16-07 | `@claude` from someone else is ignored   | High     | Secrets set                | Comment `@claude` from another account                | No run starts                                                           | manual only                  | ⬜  | ⬜      |
| TC-INFRA-16-08 | Dispatcher end to end, laptop closed     | High     | Secrets, one ready issue   | Actions → Dispatch agent → Run workflow               | Issue built, PR opened, summary explains the pick                       | manual only                  | ⬜  | ⬜      |
| TC-INFRA-16-09 | Pause works                              | Medium   | Variable settable          | Set `DISPATCH_ENABLED=false`; run the dispatcher      | Summary says paused; no build starts                                    | manual only                  | ⬜  | ⬜      |
| TC-INFRA-16-10 | Dispatcher call is not skipped (#38)     | High     | none                       | Run `pnpm test:docs`                                  | `claude.yml` conditions use `inputs.issue`, not `github.event_name`     | `scripts/workflows.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-16-11 | Dispatcher dry run (#38)                 | High     | One ready issue            | Actions → Dispatch agent → Run workflow, tick dry_run | `dry-run` job prints issue and model; `build` is skipped; no Claude run | manual only                  | ⬜  | ⬜      |
| TC-INFRA-16-12 | setup-node works without pnpm (#42)      | High     | none                       | Run `pnpm test:docs`                                  | Jobs without `pnpm/action-setup` set `package-manager-cache: false`     | `scripts/workflows.test.mjs` | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
