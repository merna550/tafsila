# Test cases — <Feature name>

| Field        | Value                   |
| ------------ | ----------------------- |
| Issue        | #<N>                    |
| SRS          | FR-...                  |
| Area         | engine / ui / api / ... |
| Last updated | YYYY-MM-DD (by PR #...) |

## Test data

Use the seeded accounts and records from `supabase/seed.sql` (see `docs/backend/seed-data.md`).

| Name                | Value                                               |
| ------------------- | --------------------------------------------------- |
| User                | `trial@tafsila.test` / `Test1234!` (3 free credits) |
| Client measurements | "Client M" (size M)                                 |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID               | Title                   | Priority | Preconditions           | Steps         | Expected result                | Automated by         | dev | staging |
| ---------------- | ----------------------- | -------- | ----------------------- | ------------- | ------------------------------ | -------------------- | --- | ------- |
| TC-<AREA>-<N>-01 | Happy path ...          | High     | Logged in as trial user | 1. ... 2. ... | ...                            | `e2e/<file>.spec.ts` | ⬜  | ⬜      |
| TC-<AREA>-<N>-02 | Validation: missing ... | High     | ...                     | ...           | Error message in Arabic: "..." | `unit/...`           | ⬜  | ⬜      |
| TC-<AREA>-<N>-03 | Edge: ...               | Medium   | ...                     | ...           | ...                            | manual only          | ⬜  | ⬜      |

Every case covers one of: happy path, validation/errors, permissions (other user's data), edge values (min/max sizes), RTL/Arabic display, mobile width, and for engine features: physical sew test (`needs:sew-test`).

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
