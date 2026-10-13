# Test cases — Egyptian default size chart

| Field        | Value                   |
| ------------ | ----------------------- |
| Issue        | #158                    |
| SRS          | FR-ADM-02, FR-MEAS-01   |
| Area         | db / admin              |
| Last updated | 2026-10-14 (by PR #158) |

## Test data

`supabase/data/egyptian-size-chart.csv` (cm). See `docs/backend/seed-data.md`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                 | Priority | Preconditions    | Steps                                  | Expected result                                                 | Automated by                                                     | dev | staging |
| ------------ | ------------------------------------- | -------- | ---------------- | -------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- | --- | ------- |
| TC-DB-158-01 | Migration equals the fixture          | High     | Repo checked out | Run the test-fixtures tests            | The drift test passes                                           | `packages/test-fixtures/src/size-chart-sql.test.ts`              | ⬜  | ⬜      |
| TC-DB-158-02 | CSV equals the fixture (cm to mm)     | High     | Repo checked out | Run the test-fixtures tests            | Every cell of the CSV equals the fixture value / 10             | `packages/test-fixtures/src/egyptian-size-chart.test.ts`         | ⬜  | ⬜      |
| TC-DB-158-03 | Every size passes the engine checks   | High     | Repo checked out | Run the engine tests                   | No errors and no warnings for S to XXL                          | `packages/engine/src/measurements/validate-measurements.test.ts` | ⬜  | ⬜      |
| TC-DB-158-04 | Fresh database has the Egyptian chart | High     | `pnpm db:reset`  | Open `/admin/sizes` as admin           | Chart named "Egyptian women S-XXL ...", no placeholder banner   | manual only                                                      | ⬜  | ⬜      |
| TC-DB-158-05 | Staging import (Merna)                | High     | Admin on staging | Import the CSV in `/admin/sizes`, save | Banner gone, sizes S-XXL show the CSV values, audit log has row | manual only                                                      | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
