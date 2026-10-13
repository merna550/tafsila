# Test cases — Mini admin API (Part A)

| Field        | Value                         |
| ------------ | ----------------------------- |
| Issue        | #32 (Part A: database + API)  |
| SRS          | FR-MEAS-01, FR-ADM (partly)   |
| Area         | api / db                      |
| Last updated | 2026-10-14 (by PR for #32, A) |

## Test data

Seed accounts from `supabase/seed.sql` (see `docs/backend/seed-data.md`): `admin@tafsila.test` (admin), `trial@tafsila.test` and `pro@tafsila.test` (normal users), password `Test1234!`. Get a token with `POST {SUPABASE_URL}/auth/v1/token?grant_type=password`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                       | Priority | Preconditions                                             | Steps                                                                  | Expected result                                                                                                          | Automated by                                       | dev | staging |
| ------------ | ------------------------------------------- | -------- | --------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | --- | ------- |
| TC-ADM-32-01 | Admin reads the stats                       | High     | Admin token                                               | `GET /api/admin/stats`                                                 | 200 with users, verifiedPhones, signupsToday, signupsLast7Days, clients                                                  | `routes/admin.test.ts`                             | ⬜  | ⬜      |
| TC-ADM-32-02 | Users list, newest first, client count only | High     | Admin token                                               | `GET /api/admin/users`                                                 | 200 page; each row has email, phone, dates, clientCount; no notes or measurements anywhere in the body                   | `routes/admin.test.ts`                             | ⬜  | ⬜      |
| TC-ADM-32-03 | Search by name, e-mail and phone            | High     | Admin token                                               | `GET /api/admin/users?q=pro@tafsila`, then a name, then `+20100000000` | Matching users only; `%` and `_` are matched literally                                                                   | `routes/admin.test.ts`, `admin-functions.test.sql` | ⬜  | ⬜      |
| TC-ADM-32-04 | Verified filter and paging                  | Medium   | Admin token                                               | `?verified=true`, `?verified=false`, `?limit=1&offset=1`               | Only (un)verified users; `total` counts all matches                                                                      | `routes/admin.test.ts`, `admin-functions.test.sql` | ⬜  | ⬜      |
| TC-ADM-32-05 | Bad filter value                            | Low      | Admin token                                               | `GET /api/admin/users?verified=maybe`                                  | 400 `VALIDATION_FAILED`                                                                                                  | `routes/admin.test.ts`                             | ⬜  | ⬜      |
| TC-ADM-32-06 | User detail                                 | Medium   | Admin token                                               | `GET /api/admin/users/{id}`; then an unknown id                        | 200 with counts, locale, role; unknown id gives 404 `NOT_FOUND`                                                          | `routes/admin.test.ts`                             | ⬜  | ⬜      |
| TC-ADM-32-07 | Permissions: no token                       | High     | none                                                      | Call each `/api/admin/*` route without a token                         | 401 `UNAUTHENTICATED`                                                                                                    | `routes/admin.test.ts`, Newman ERR case            | ⬜  | ⬜      |
| TC-ADM-32-08 | Permissions: normal user                    | High     | Token of `trial@`                                         | Call each `/api/admin/*` route, including `PUT`                        | 403 `FORBIDDEN`; the chart and the audit table are unchanged                                                             | `routes/admin.test.ts`, Newman ERR cases           | ⬜  | ⬜      |
| TC-ADM-32-09 | Permissions: stale admin token              | High     | Token says admin, the profile role was set back to `user` | Call `GET /api/admin/stats` and `PUT` the chart                        | 403 `FORBIDDEN` from the database check; nothing written                                                                 | `routes/admin.test.ts`, `repositories.db.test.ts`  | ⬜  | ⬜      |
| TC-ADM-32-10 | Database functions are private              | High     | Local Supabase                                            | `pnpm db:test`                                                         | anon and authenticated cannot execute the admin functions; a non-admin id raises 42501                                   | `admin-functions.test.sql`                         | ⬜  | ⬜      |
| TC-ADM-32-11 | Read the default chart                      | High     | Admin token                                               | `GET /api/admin/size-charts/default`                                   | 200; `isPlaceholder` true while the name starts with PLACEHOLDER; `updatedBy` null until first edit                      | `routes/admin.test.ts`                             | ⬜  | ⬜      |
| TC-ADM-32-12 | Save a valid chart                          | High     | Admin token                                               | `PUT` the chart with a new `name` and changed values                   | 200; new name, `isPlaceholder` false, `updatedBy` is the admin; one `size_chart.updated` audit row with before and after | `routes/admin.test.ts`, `repositories.db.test.ts`  | ⬜  | ⬜      |
| TC-ADM-32-13 | Impossible values are refused               | High     | Admin token                                               | `PUT` a chart where `highBust` is above `bust` in size M               | 422 `SIZE_CHART_INVALID`; `details.fields` has `M.highBust`; nothing saved, no audit row                                 | `routes/admin.test.ts`                             | ⬜  | ⬜      |
| TC-ADM-32-14 | Empty or malformed body                     | Medium   | Admin token                                               | `PUT` `{ "sizes": {} }`, then `{}`                                     | 400 `VALIDATION_FAILED`                                                                                                  | `routes/admin.test.ts`                             | ⬜  | ⬜      |
| TC-ADM-32-15 | Name is kept when not sent                  | Low      | Admin token                                               | `PUT` with `sizes` only                                                | 200; the name is unchanged                                                                                               | `routes/admin.test.ts`                             | ⬜  | ⬜      |

Every case covers one of: happy path, validation/errors, permissions, edge values. The screens (Part B) have their own file.

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
