# Test cases — Plans live on the issue only

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #179                        |
| SRS          | None (process)              |
| Area         | docs                        |
| Last updated | 2026-10-18 (by PR for #179) |

## Test data

An open `status:needs-plan` issue.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                           | Priority | Preconditions      | Steps                             | Expected result                                     | Automated by                 | dev | staging |
| -------------- | ------------------------------- | -------- | ------------------ | --------------------------------- | --------------------------------------------------- | ---------------------------- | --- | ------- |
| TC-DOCS-179-01 | `/plan` makes no git changes    | High     | Clean checkout     | Run `/plan #N`, then `git status` | Plan comment posted; no branch, file or PR          | manual only                  | ⬜  | ⬜      |
| TC-DOCS-179-02 | Build PR contains the plan file | High     | Approved plan      | Run `/build #N`                   | PR has `docs/plans/<N>-<slug>.md` with "Deviations" | manual only                  | ⬜  | ⬜      |
| TC-DOCS-179-03 | No plan PR wording remains      | Medium   | Branch checked out | Run `pnpm test`                   | Guard test in `scripts/workflows.test.mjs` passes   | `scripts/workflows.test.mjs` | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
