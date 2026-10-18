# Test cases — Learning log files

| Field        | Value                   |
| ------------ | ----------------------- |
| Issue        | #180                    |
| SRS          | None (process)          |
| Area         | docs                    |
| Last updated | 2026-10-18 (by PR #180) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                      | Priority | Preconditions | Steps                                                | Expected result                       | Automated by                          | dev | staging |
| -------------- | -------------------------- | -------- | ------------- | ---------------------------------------------------- | ------------------------------------- | ------------------------------------- | --- | ------- |
| TC-DOCS-180-01 | Stale index is caught      | High     | Clean tree    | Add a file in `learning-log/`, run `pnpm docs:check` | Fails, tells to run the index command | `scripts/learning-log-index.test.mjs` | ⬜  | ⬜      |
| TC-DOCS-180-02 | Two branches merge cleanly | High     | Clean tree    | Each branch adds a log file; merge                   | No conflict                           | `scripts/learning-log-index.test.mjs` | ⬜  | ⬜      |
