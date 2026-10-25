# Test cases — Pattern preview worker

| Field        | Value                |
| ------------ | -------------------- |
| Issue        | #239                 |
| SRS          | FR-PAT-04, FR-PAT-01 |
| Area         | ui                   |
| Last updated | 2026-10-19 (by #239) |

## Test data

The seed designs `seedDress`, `onePieceDress` and `dartedBlouse` at size M, drafted by the worker (the dev route was removed in #251; the pattern page hosts the preview now).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                          | Priority | Preconditions              | Steps                                                   | Expected result                                          | Automated by               | dev | staging |
| ------------ | ------------------------------ | -------- | -------------------------- | ------------------------------------------------------- | -------------------------------------------------------- | -------------------------- | --- | ------- |
| TC-UI-239-01 | Seed designs draft in a worker | High     | Production build           | 1. Open the dev route for each design                   | Status becomes done; pieces above 0; time in ms is shown | `e2e/pattern-page.spec.ts` | ⬜  | ⬜      |
| TC-UI-239-02 | Low-end phone, no freeze       | Medium   | A low-end phone on staging | 1. Open the dev route 2. Scroll and tap while it drafts | Page stays responsive; note the time shown               | manual only                | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
