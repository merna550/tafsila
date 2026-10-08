# Test cases — Milestone briefs and planning commands

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #22                        |
| SRS          | SRS section 12, 13         |
| Area         | docs                       |
| Last updated | 2026-10-08 (by PR for #22) |

## Test data

A GitHub repo with open `status:needs-plan` issues in one milestone, some depending on others.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                          | Priority | Preconditions             | Steps                                                     | Expected result                                                                      | Automated by   | dev | staging |
| ------------- | ---------------------------------------------- | -------- | ------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------- | --- | ------- |
| TC-DOCS-22-01 | Briefs link every M0 and M1 issue              | High     | Briefs merged             | Compare `gh issue list --milestone` with the brief tables | Every open and closed issue of M0 and M1 appears in its brief                        | manual only    | ⬜  | ⬜      |
| TC-DOCS-22-02 | Docs check passes                              | High     | Branch checked out        | Run `pnpm docs:check`                                     | No broken link, no missing card                                                      | `pnpm quality` | ⬜  | ⬜      |
| TC-DOCS-22-03 | `/plan-wave` skips issues with open dependency | High     | Issue B depends on open A | Run `/plan-wave` with Opus                                | A is planned, B is listed as skipped with "waits for A"                              | manual only    | ⬜  | ⬜      |
| TC-DOCS-22-04 | `/plan-wave` does not approve by itself        | High     | Plans posted              | Do not reply                                              | Issues stay `status:plan-review`; after "approved except #N", only N stays in review | manual only    | ⬜  | ⬜      |
| TC-DOCS-22-05 | `/plan-milestone` drafts issues in Backlog     | Medium   | M2 row in SRS 12          | Run `/plan-milestone M2` with Opus                        | Brief exists; issues carry the M2 milestone and `status:plan-review`                 | manual only    | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
