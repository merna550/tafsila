# Test cases — /deliver

| Field        | Value                   |
| ------------ | ----------------------- |
| Issue        | #185                    |
| SRS          | None (process)          |
| Area         | infra / agents          |
| Last updated | 2026-10-18 (by PR #185) |

## Test data

Fixtures in `scripts/fixtures/deliver/` (`green`, `red-twice`, `conflict`, `not-ready`, `missing-closes`, `head-moved`, `main-red`).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                             | Priority | Preconditions                                          | Steps                                                     | Expected result                                              | Automated by                 | dev | staging |
| ------------- | --------------------------------- | -------- | ------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------- | --- | ------- |
| TC-INF-185-01 | Deliver a small docs-only issue   | High     | Test issue: `plan:none`, `build:haiku`, `status:ready` | 1. Run `/deliver #N`                                      | Merged PR, closed issue, deleted branch, Arabic line "دُمج"  | manual only (one real merge) | ⬜  | ⬜      |
| TC-INF-185-02 | Refuse an issue that is not ready | High     | Issue with `status:plan-review`                        | 1. Run `/deliver #N`                                      | One-line refusal, no label change                            | `scripts/deliver.test.mjs`   | ⬜  | ⬜      |
| TC-INF-185-03 | Red CI twice with the same cause  | High     | Fixture `red-twice.json`                               | 1. Run `gate` with the fixture, then `/deliver --dry-run` | Verdict `fix`; second identical failure gives `would: block` | `scripts/deliver.test.mjs`   | ⬜  | ⬜      |
| TC-INF-185-04 | Dispatcher skips an issue in work | High     | `/deliver` building #N (`status:in-progress`)          | 1. Run Dispatch agent with `dry_run: true`                | It does not print `issue=#N`                                 | `scripts/dispatch.test.mjs`  | ⬜  | ⬜      |
| TC-INF-185-05 | Refuse an `agent:auto` issue      | Medium   | Issue with `agent:auto`                                | 1. Run `/deliver #N`                                      | Refused: owned by the dispatcher                             | `scripts/deliver.test.mjs`   | ⬜  | ⬜      |
| TC-INF-185-06 | Red main stops the queue          | Medium   | Fixture `main-red.json`                                | 1. Run `deliver.mjs base --fixture ...main-red.json`      | State `red`, queue stops before building                     | `scripts/deliver.test.mjs`   | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
