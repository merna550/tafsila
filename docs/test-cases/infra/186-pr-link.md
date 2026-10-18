# Test cases — PR link and base check

| Field        | Value                   |
| ------------ | ----------------------- |
| Issue        | #186                    |
| SRS          | None (process)          |
| Area         | infra / agents          |
| Last updated | 2026-10-18 (by PR #186) |

## Test data

Fixtures in `scripts/fixtures/pr-link/` (`no-keyword`, `part-of`, `stacked-base`, `linked`).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID              | Title                     | Priority | Preconditions                  | Steps                        | Expected result                                       | Automated by               | dev | staging |
| --------------- | ------------------------- | -------- | ------------------------------ | ---------------------------- | ----------------------------------------------------- | -------------------------- | --- | ------- |
| TC-INFRA-186-01 | Missing keyword is added  | High     | Draft PR from `chore/<N>-test` | Open the PR with no `Closes` | Body starts with `Closes #N`                          | `scripts/pr-link.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-186-02 | Part of gets a note       | High     | PR body `Part of #N`           | Open the PR                  | Comment and label `needs:link`, check passes          | `scripts/pr-link.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-186-03 | Wrong base fails          | High     | PR with base `feat/x`          | Open the PR                  | Check fails: "base must be main"; `stacked` allows it | `scripts/pr-link.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-186-04 | Merge closes the issue    | High     | PR from `build.md`             | Merge it                     | Issue closes, shows the PR under Development          | manual only                | ⬜  | ⬜      |
| TC-INFRA-186-05 | Missing files after merge | Medium   | Merged PR whose file is absent | `deliver.mjs merge`          | `missingOnMain` lists it                              | `scripts/deliver.test.mjs` | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
