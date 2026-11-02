# Test cases — billing tables

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #367                        |
| SRS          | Section 7 (data model)      |
| Area         | db                          |
| Last updated | 2026-11-02 (by PR for #367) |

## Test data

| Name | Value                                                                             |
| ---- | --------------------------------------------------------------------------------- |
| User | `trial@tafsila.test` / `Test1234!` (3 trial + 5 pack credits, 1 debit: balance 7) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                   | Priority | Preconditions  | Steps                                                                                        | Expected result                                                                      | Automated by                               | dev | staging |
| ------------ | ----------------------- | -------- | -------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------ | --- | ------- |
| TC-DB-367-01 | Reset applies migration | High     | Docker running | 1. `pnpm db:reset`                                                                           | No error; 4 products exist with prices in piastres                                   | CI `db-reset` job                          | ⬜  | ⬜      |
| TC-DB-367-02 | Seed balance visible    | Medium   | After reset    | 1. In Studio SQL run `select private.credit_balance('00000000-0000-4000-8000-000000000001')` | Returns 7; ledger has 2 grants and 1 debit                                           | manual only                                | ⬜  | ⬜      |
| TC-DB-367-03 | RLS and writers         | High     | After reset    | 1. `pnpm db:test`                                                                            | `billing.test.sql` passes: owner and admin read, no direct writes, FIFO, idempotency | `supabase/tests/database/billing.test.sql` | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
