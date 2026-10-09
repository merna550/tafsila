# Test cases — Agent usage metrics

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #36                        |
| SRS          | NFR-13                     |
| Area         | infra                      |
| Last updated | 2026-10-09 (by PR for #36) |

## Test data

No seeded records are needed. Fixtures are in `scripts/agent-usage.test.mjs` and `scripts/agent-report.test.mjs`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                         | Priority | Preconditions                  | Steps                                                            | Expected result                                                                                     | Automated by                            | dev | staging |
| ------------ | --------------------------------------------- | -------- | ------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------- | --- | ------- |
| TC-AGU-36-01 | Action run writes a record and comments       | High     | `claude.yml` run finished      | 1. Open `metrics` branch, `agent-runs.jsonl` 2. Open the issue   | A new line for the run; one `🤖 Run · …` comment on the issue                                       | manual only (needs a real run)          | ⬜  | ⬜      |
| TC-AGU-36-02 | Push conflict is retried                      | High     | none                           | 1. Run the append test                                           | Both lines are on `metrics` after a simulated race                                                  | `scripts/agent-usage.test.mjs`          | ⬜  | ⬜      |
| TC-AGU-36-03 | Session writes `.agent-usage.json`            | High     | A local `/build` session ended | 1. Open the PR body                                              | Collapsed "Agent usage" block with the summary line                                                 | `scripts/agent-usage.test.mjs`          | ⬜  | ⬜      |
| TC-AGU-36-04 | Missing or broken input does not crash        | High     | none                           | 1. Run the tests with empty, bad and partial input               | Zeros or a skipped record, exit code 0                                                              | both script tests                       | ⬜  | ⬜      |
| TC-AGU-36-05 | No prompt text, code or secrets in a record   | High     | none                           | 1. Run the record privacy test                                   | Fixture secrets never appear in the record                                                          | `scripts/agent-usage.test.mjs`          | ⬜  | ⬜      |
| TC-AGU-36-06 | Weekly report has all sections                | High     | `metrics` branch has records   | 1. Actions → Agent usage report → Run workflow 2. Open the issue | Totals, medians by size/area/model, top 3, flags and suggestions; second run updates the same issue | `scripts/agent-report.test.mjs` (logic) | ⬜  | ⬜      |
| TC-AGU-36-07 | Report workflow is weekly and least-privilege | Medium   | none                           | 1. Run the workflow test                                         | Sunday cron, `workflow_dispatch`, only `contents: read` and `issues: write`                         | `scripts/workflows.test.mjs`            | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
