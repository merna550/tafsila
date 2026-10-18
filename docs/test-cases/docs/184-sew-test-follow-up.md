# Test cases — Sew-test follow-up issues

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #184                        |
| SRS          | §12 (toiles in 3 sizes)     |
| Area         | docs                        |
| Last updated | 2026-10-18 (by PR for #184) |

## Test data

A terminal at the repo root with `pnpm install` done.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                                  | Priority | Preconditions      | Steps                                                                                                         | Expected result                                        | Automated by                         | dev | staging |
| -------------- | -------------------------------------- | -------- | ------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------ | --- | ------- |
| TC-DOCS-184-01 | Missing follow-up line warns           | High     | Branch checked out | 1. Run `PR_BODY="Closes #1" PR_LABELS='["area:engine","needs:sew-test"]' node scripts/sew-test-followup.mjs`. | Prints `::warning ...`, exit code 0                    | `scripts/sew-test-followup.test.mjs` | ⬜  | ⬜      |
| TC-DOCS-184-02 | Follow-up line present is silent       | High     | Branch checked out | 1. Same as above with body `Sew-test follow-up: #197`.                                                        | No output                                              | `scripts/sew-test-followup.test.mjs` | ⬜  | ⬜      |
| TC-DOCS-184-03 | Non-engine or unlabelled PR is ignored | Medium   | Branch checked out | 1. Use labels without `needs:sew-test` or without `area:engine`.                                              | No output                                              | `scripts/sew-test-followup.test.mjs` | ⬜  | ⬜      |
| TC-DOCS-184-04 | Follow-ups exist and #148 links them   | High     | GitHub access      | 1. Open #148. 2. Open #197 to #201.                                                                           | #148 depends on all five; each has the toile checklist | manual only                          | ⬜  | ⬜      |

Mobile: not applicable.
