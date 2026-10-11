# Test cases — Shared files that every PR touches

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #76                        |
| SRS          | NFR-12                     |
| Area         | infra                      |
| Last updated | 2026-10-11 (by PR for #76) |

## Test data

A clean checkout of `main`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                                         | Priority | Preconditions | Steps                                                               | Expected result                                                         | Automated by                      | dev | staging |
| -------------- | --------------------------------------------- | -------- | ------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------- | --- | ------- |
| TC-INFRA-76-01 | Duplicate ADR numbers fail                    | High     | none          | Run `pnpm test:docs`                                                | Two headings or files with the same number are reported, naming both    | `scripts/check-handbook.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-76-02 | Decision files follow the naming rule         | High     | none          | Run `pnpm test:docs`                                                | A file without an issue number, or whose heading disagrees, is reported | `scripts/check-handbook.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-76-03 | The generated index is not committed          | Medium   | none          | Run `bash scripts/test-case-index.sh`, then `git status`            | `docs/test-cases/index.md` exists and git ignores it                    | manual only                       | ⬜  | ⬜      |
| TC-INFRA-76-04 | Two parallel PRs no longer conflict on shared | High     | two branches  | Add a decision file and a CLAUDE.md-free change on each; merge both | No conflict in `docs/decisions/`, `CLAUDE.md` or the test-case index    | manual only                       | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
