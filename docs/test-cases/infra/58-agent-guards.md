# Test cases — Agent guards (production commands, interactive issues, failed builds)

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #58                        |
| SRS          | NFR-13                     |
| Area         | infra                      |
| Last updated | 2026-10-09 (by PR for #58) |

## Test data

None. Use a throwaway issue for TC-INF-58-03 and close it afterwards. The deny-rule presence and the token permission are covered by TC-INFRA-58-01/02 in [agent-deny-rules.md](../agent-deny-rules.md) (PR #60).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                    | Priority | Preconditions                                | Steps                                                                 | Expected result                                                                                | Automated by                                                | dev | staging |
| ------------ | ---------------------------------------- | -------- | -------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --- | ------- |
| TC-INF-58-01 | Agent cannot run production commands     | High     | A Claude Code session in the repo            | 1. Ask the agent to create a GitHub release with `gh`                 | The harness refuses the command; no release is created                                         | `scripts/workflows.test.mjs` (rules present)                | ✅  | ⬜      |
| TC-INF-58-02 | Dispatcher skips `needs:interactive`     | High     | Dispatcher on, one ready issue with the flag | 1. Run Dispatch with `dry_run`                                        | The flagged issue is not picked; another ready issue is, or none                               | `scripts/dispatch.test.mjs`                                 | ⬜  | ⬜      |
| TC-INF-58-03 | Failed dispatcher build blocks the issue | High     | A ready throwaway issue that cannot succeed  | 1. Let the dispatcher build it. 2. Open the issue after the run fails | `status:blocked`, no `status:ready`; a comment with the reason, the run link, refused commands | `scripts/claude-run.test.mjs`, `scripts/workflows.test.mjs` | ⬜  | ⬜      |
| TC-INF-58-04 | Refused commands appear in the run log   | Medium   | A Claude agent run with a refusal            | 1. Open the "Fail when Claude was refused a tool" step                | One `Refused tool: <tool>: <command>` error per refusal, tokens redacted                       | `scripts/claude-run.test.mjs`                               | ⬜  | ⬜      |

## Manual run log

| Date       | Env | Tester | Result | Notes                                                  |
| ---------- | --- | ------ | ------ | ------------------------------------------------------ |
| 2026-10-09 | dev | Claude | ✅     | TC-INF-58-01: release command refused by the deny rule |
