# Test cases — Agent production deny rules

| Field        | Value                  |
| ------------ | ---------------------- |
| Issue        | #58                    |
| SRS          | None (tooling)         |
| Area         | infra                  |
| Last updated | 2026-10-08 (by PR #58) |

## Test data

None.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                           | Priority | Preconditions        | Steps                               | Expected result          | Automated by                 | dev | staging |
| -------------- | ------------------------------- | -------- | -------------------- | ----------------------------------- | ------------------------ | ---------------------------- | --- | ------- |
| TC-INFRA-58-01 | Deny rules present in settings  | High     | Repo checked out     | Run `pnpm test`                     | All six deny rules found | `scripts/workflows.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-58-02 | Token has no Actions permission | High     | Access to GitHub PAT | Open the PAT settings, read Actions | Actions = No access      | manual only                  | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
