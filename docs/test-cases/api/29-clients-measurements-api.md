# Test cases - Clients and measurement sets API

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #29                        |
| SRS          | FR-MEAS-04                 |
| Area         | api                        |
| Last updated | 2026-10-11 (by PR for #29) |

## Test data

Seed accounts from `supabase/seed.sql` (see `docs/backend/seed-data.md`): `trial@tafsila.test` (1 client) and `pro@tafsila.test` (5 clients). Postman against local uses `trial@`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                                 | Priority | Preconditions            | Steps                                                            | Expected result                                                                               | Automated by                                                     | dev | staging |
| ------------ | ----------------------------------------------------- | -------- | ------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --- | ------- |
| TC-API-29-01 | Create, read, update, delete a client                 | High     | Postman, local, `trial@` | Run the "Clients and measurements" folder                        | Statuses 201, 200, 200, 200, 204; no error                                                    | `pnpm api:test`, `routes/clients-measurements.test.ts`           | ⬜  | ⬜      |
| TC-API-29-02 | List clients with paging and name search              | High     | Logged in as `pro@`      | `GET /api/clients?limit=2&offset=2`, then `?q=client 1`          | 2 items and `total: 5`; search finds only "Client 1"                                          | `services/clients.test.ts`                                       | ⬜  | ⬜      |
| TC-API-29-03 | Another user cannot read, change or delete a client   | High     | Two accounts             | User B calls GET, PATCH, DELETE on A's client id                 | 404 `NOT_FOUND` each time; A's client is unchanged                                            | `routes/clients-measurements.test.ts`, `repositories.db.test.ts` | ⬜  | ⬜      |
| TC-API-29-04 | Save valid measurements                               | High     | Logged in                | `POST /api/measurements` with the size M body                    | 201, `warnings: []`                                                                           | `services/measurement-sets.test.ts`                              | ⬜  | ⬜      |
| TC-API-29-05 | Save measurements with `highBust` above `bust`        | High     | Logged in                | `POST /api/measurements` with highBust 1000, bust 900            | 422 `MEASUREMENTS_INVALID`; `details.issues` has `message_ar` and `message_en`; nothing saved | ERR case in Postman, route test                                  | ⬜  | ⬜      |
| TC-API-29-06 | Save measurements with `waist` at or above `hip`      | Medium   | Logged in                | `POST /api/measurements` with waist 1100                         | 201 and a `MEAS_WAIST_NOT_BELOW_HIP` warning                                                  | `services/measurement-sets.test.ts`                              | ⬜  | ⬜      |
| TC-API-29-07 | A set cannot point at another user's client           | High     | Two accounts             | User B posts a set with A's `clientId`                           | 404 `NOT_FOUND`                                                                               | route test, `repositories.db.test.ts`                            | ⬜  | ⬜      |
| TC-API-29-08 | Deleting a client deletes its sets                    | Medium   | Client with a set        | `DELETE /api/clients/{id}`, then `GET /api/measurements/{setId}` | 204, then 404                                                                                 | `services/clients.test.ts`, db test                              | ⬜  | ⬜      |
| TC-API-29-09 | `pnpm api:test` is green, and red when a route breaks | Medium   | -                        | Run `pnpm api:test`; run it with `--break=health`                | Exit 0; exit 1                                                                                | `scripts/api-test.test.mjs`                                      | ⬜  | ⬜      |
| TC-API-29-10 | No token gives 401 on every route                     | High     | -                        | Call each of the ten routes without `Authorization`              | 401 `UNAUTHENTICATED` with the standard body                                                  | `routes/clients-measurements.test.ts`                            | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
