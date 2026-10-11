# Test cases — M1 schema with RLS and seed users

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #24                        |
| SRS          | Section 7, NFR-04          |
| Area         | db                         |
| Last updated | 2026-10-11 (by PR for #24) |

## Test data

Seeded accounts from `supabase/seed.sql` (see `docs/backend/seed-data.md`): `trial@`, `pro@`, `empty@`, `admin@` at `tafsila.test`, password `Test1234!`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID          | Title                                 | Priority | Preconditions        | Steps                                             | Expected result                                                     | Automated by                                 | dev | staging |
| ----------- | ------------------------------------- | -------- | -------------------- | ------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------- | --- | ------- |
| TC-DB-24-01 | Seed users can sign in locally        | High     | `pnpm db:reset` done | Sign in as each seed account in Studio / auth API | All four sign in; admin profile has role admin                      | manual only                                  | ⬜  | ⬜      |
| TC-DB-24-02 | Migrations apply on a clean database  | High     | Local Supabase       | Run `pnpm db:reset`                               | No error; seed rows present                                         | CI `db-reset` job                            | ⬜  | ⬜      |
| TC-DB-24-03 | Migrations apply on staging           | High     | Merged to main       | Check the staging migrate job                     | Job green                                                           | CI staging job                               | ⬜  | ⬜      |
| TC-DB-24-04 | Cross-user access is refused          | High     | pgTAP                | `pnpm db:test`                                    | B reads, updates, deletes nothing of A; foreign client refused      | `supabase/tests/database/rls.test.sql` (1-5) | ⬜  | ⬜      |
| TC-DB-24-05 | Role escalation is refused            | High     | pgTAP                | `pnpm db:test`                                    | Changing role or phone_verified_at is permission denied             | `rls.test.sql` (6-9)                         | ⬜  | ⬜      |
| TC-DB-24-06 | Size charts and audit log permissions | High     | pgTAP                | `pnpm db:test`                                    | Only admin writes system charts; audit is append-only, admin only   | `rls.test.sql` (10-21)                       | ⬜  | ⬜      |
| TC-DB-24-07 | Sign-up, cascade, API role, phone     | High     | pgTAP                | `pnpm db:test`                                    | Profile created; deleting a user removes rows; api_app alone denied | `rls.test.sql` (22-31)                       | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
