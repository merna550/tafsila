# Test cases — Builder waits for CI

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #178                        |
| SRS          | None (process)              |
| Area         | infra                       |
| Last updated | 2026-10-18 (by PR for #178) |

## Test data

Use `scripts/fixtures/ci-failure.log.txt` for deterministic log filtering. Use existing real pull requests with completed red and green checks for the CLI dry run; do not change those pull requests.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                              | Priority | Preconditions                            | Steps                                                                      | Expected result                                                                                             | Automated by               | dev | staging |
| ------------- | ---------------------------------- | -------- | ---------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------- | --- | ------- |
| TC-INF-178-01 | Green checks                       | High     | PR checks change from pending to green   | Run the waiter with those snapshots                                        | It waits, reports `mergeable_state` and exits 0 only after every check completes green                      | `scripts/ci-wait.test.mjs` | ✅  | -       |
| TC-INF-178-02 | Red check with a long coloured log | High     | Failed Actions job and saved log         | Run the waiter and inspect stdout                                          | It exits 1; ANSI is removed; only failure patterns appear; no more than 40 lines are printed for the job    | `scripts/ci-wait.test.mjs` | ✅  | -       |
| TC-INF-178-03 | Checks never start or finish       | High     | No completed check before the deadline   | Run the waiter with a short injected timeout                               | It exits 2 and reports the pending state                                                                    | `scripts/ci-wait.test.mjs` | ✅  | -       |
| TC-INF-178-04 | Real red then green PR dry run     | High     | Existing PRs with completed red/green CI | Run `node scripts/ci-wait.mjs <red-pr>`, then with `<green-pr>`            | Red exits 1 with bounded failure lines; green exits 0; both report mergeability                             | manual only                | ✅  | -       |
| TC-INF-178-05 | Builder retry cap                  | Medium   | A builder PR fails CI                    | Follow `.claude/procedures/build.md`; let three wait/fix rounds remain red | The builder comments the failure, sets `status:blocked`, pushes its branch and returns a `BLOCKED:` summary | manual only                | ⬜  | -       |

## Manual run log

| Date       | Env | Tester | Result | Notes                                                                  |
| ---------- | --- | ------ | ------ | ---------------------------------------------------------------------- |
| 2026-10-18 | dev | Codex  | ✅     | PR #118 exited 1 with filtered failure lines; PR #190 exited 0 (green) |
