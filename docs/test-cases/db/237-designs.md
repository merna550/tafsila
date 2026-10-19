# Test cases — designs and pattern_versions

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #237                        |
| SRS          | Section 7 (data model)      |
| Area         | db                          |
| Last updated | 2026-10-19 (by PR for #237) |

## Test data

| Name | Value                                                              |
| ---- | ------------------------------------------------------------------ |
| User | `trial@tafsila.test` / `Test1234!` (owns `Seed dress`, 2 versions) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                            | Priority | Preconditions  | Steps                                                     | Expected result                                                                           | Automated by                               | dev | staging |
| ------------ | -------------------------------- | -------- | -------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------ | --- | ------- |
| TC-DB-237-01 | Reset applies migration and seed | High     | Docker running | 1. `pnpm db:reset`                                        | No error; tables `designs`, `pattern_versions` exist                                      | CI `db-reset` job                          | ⬜  | ⬜      |
| TC-DB-237-02 | Seed design visible              | Medium   | After reset    | 1. Open Studio table `designs` 2. Open `pattern_versions` | 1 design `Seed dress`, versions 1 and 2, `current_version_id` = v2                        | manual only                                | ⬜  | ⬜      |
| TC-DB-237-03 | RLS spot check                   | High     | After reset    | 1. `pnpm db:test`                                         | `designs.test.sql` passes: other users see nothing, versions cannot be updated or deleted | `supabase/tests/database/designs.test.sql` | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
