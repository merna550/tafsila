# Test cases - Designs API

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #242                        |
| SRS          | FR-DES-06                   |
| Area         | api                         |
| Last updated | 2026-10-19 (by PR for #242) |

## Test data

Seed accounts from `supabase/seed.sql` (see `docs/backend/seed-data.md`): `trial@tafsila.test` has one design ("Seed dress", 2 versions, for "Client M").

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                         | Priority | Preconditions            | Steps                                                        | Expected result                                                        | Automated by                                          | dev | staging |
| ------------- | --------------------------------------------- | -------- | ------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------- | --- | ------- |
| TC-API-242-01 | Create, read, list, rename, delete a design   | High     | Postman, local, `trial@` | Run the "Designs" folder                                     | Statuses 201, 200, 200, 200, 204; no error                             | `routes/designs.test.ts`                              | ⬜  | ⬜      |
| TC-API-242-02 | Default title in Arabic for an `ar` profile   | Medium   | Logged in, `ar` profile  | `POST /api/designs` with `{ "category": "dress" }`           | Title like `فستان 2026-10-19` (today in Cairo)                         | `services/designs.test.ts`                            | ⬜  | ⬜      |
| TC-API-242-03 | List with `q` and `clientId` on the seed data | High     | Logged in as `trial@`    | `GET /api/designs?q=seed`, then `?clientId=<id of Client M>` | Both return "Seed dress" with `versionCount: 2`, `currentStatus: pass` | `services/designs.test.ts`, `repositories.db.test.ts` | ⬜  | ⬜      |
| TC-API-242-04 | Another user gets 404                         | High     | Two accounts             | User B calls GET, PATCH, DELETE on A's design id             | 404 `NOT_FOUND` each time; A's design is unchanged; B's list is empty  | `routes/designs.test.ts`, `repositories.db.test.ts`   | ⬜  | ⬜      |
| TC-API-242-05 | No token gives 401                            | High     | -                        | Call each of the five routes without `Authorization`         | 401 `UNAUTHENTICATED` with the standard body                           | `routes/designs.test.ts`                              | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
