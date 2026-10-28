# Test cases — Fabric tables and API

| Field        | Value                                   |
| ------------ | --------------------------------------- |
| Issue        | #317                                    |
| SRS          | FR-REC-02, FR-REC-03, FR-ADM-02, NFR-04 |
| Area         | api / db                                |
| Last updated | 2026-10-28 (by PR for #317)             |

## Test data

Seed accounts from `supabase/seed.sql` (see `docs/backend/seed-data.md`): `admin@tafsila.test` (admin), `trial@tafsila.test` and `pro@tafsila.test` (normal users), password `Test1234!`. The 16 fabrics and 21 rules come from the migration `20261028120000_fabrics.sql`. A saved version of the half-circle V-neck dress is needed for the recommend and calculation cases (`POST /api/designs/{id}/versions`).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                          | Priority | Preconditions                            | Steps                                                                             | Expected result                                                                                                                                           | Automated by                                              | dev | staging |
| ------------- | ---------------------------------------------- | -------- | ---------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --- | ------- |
| TC-API-317-01 | Recommend fabrics for a saved version          | High     | Token of the version's owner             | `GET /api/fabrics/recommend?versionId=<id>`                                       | 200; 3 to 5 `recommended` with a bilingual reason each, a non-empty `avoid` list, `isDraft` true while rows are draft                                     | `routes/fabrics.test.ts`, Newman journey                  | ⬜  | ⬜      |
| TC-API-317-02 | Save and read a fabric calculation             | High     | Token of the owner                       | `PUT /api/versions/<id>/fabric` with options and result; then `GET` the same path | 200 both times; the read returns the saved options, result and `nestingVersion`; a second save with the same options replaces it                          | `routes/fabrics.test.ts`, Newman journey                  | ⬜  | ⬜      |
| TC-API-317-03 | Another user's version is 404                  | High     | Token of a different user                | Call recommend, `PUT` and `GET` fabric for the first user's version               | 404 `NOT_FOUND` on each; nothing written                                                                                                                  | `routes/fabrics.test.ts`, Newman ERR cases                | ⬜  | ⬜      |
| TC-API-317-04 | Admin edits a fabric and the audit row appears | High     | Admin token                              | `PATCH /api/admin/fabrics/crepe` with `{ "isDraft": false }`; read `admin_audit`  | 200; one `fabric.updated` row with target `crepe`, `before.isDraft` true and `after.isDraft` false                                                        | `routes/admin-fabrics.test.ts`                            | ⬜  | ⬜      |
| TC-API-317-05 | Non-admin gets 403                             | High     | Token of a normal user                   | Call each `/api/admin/fabrics*` and `/api/admin/fabric-rules*` route              | 403 `FORBIDDEN`; no row and no audit row written; no token gives 401                                                                                      | `routes/admin-fabrics.test.ts`, Newman ERR cases          | ⬜  | ⬜      |
| TC-API-317-06 | Invalid rule is refused with the field named   | High     | Admin token                              | `POST /api/admin/fabric-rules` with `when.path` `skirt.typ`                       | 422 `FABRIC_RULE_INVALID`; `details.fields["when.0"]` names the path; nothing saved                                                                       | `routes/admin-fabrics.test.ts`                            | ⬜  | ⬜      |
| TC-API-317-07 | Invalid calculation is refused                 | High     | Token of the owner                       | `PUT` fabric with `lengthM` -1, 0 and 2.35                                        | 422 `FABRIC_CALC_INVALID`; `details.fields` names `kinds.0.lengthM`; nothing saved                                                                        | `routes/fabrics.test.ts`                                  | ⬜  | ⬜      |
| TC-API-317-08 | Duplicate id is refused                        | Medium   | Admin token                              | `POST /api/admin/fabrics` with id `crepe`                                         | 409 `FABRIC_ID_TAKEN`; no audit row                                                                                                                       | `routes/admin-fabrics.test.ts`                            | ⬜  | ⬜      |
| TC-API-317-09 | Stale admin token is refused by the database   | High     | Token says admin, profile role is `user` | `POST` a fabric, `PATCH` and `DELETE` a rule                                      | 403 `FORBIDDEN`; nothing written, no audit row                                                                                                            | `routes/admin-fabrics.test.ts`, `repositories.db.test.ts` | ⬜  | ⬜      |
| TC-API-317-10 | RLS on the three tables                        | High     | Local Supabase                           | `pnpm db:test`                                                                    | Signed-in users read the catalogue; non-admins cannot write it; calculations are owner-only, admins read them; deleting a design removes its calculations | `fabrics.test.sql`                                        | ⬜  | ⬜      |
| TC-API-317-11 | Migration seed equals the package data         | Medium   | none                                     | `pnpm --filter @tafsila/fabric-kb test`                                           | The migration ends with the generated SQL; 16 fabrics and 21 rules                                                                                        | `packages/fabric-kb/src/seed-sql.test.ts`                 | ⬜  | ⬜      |

Every case covers one of: happy path, validation/errors, permissions (other user's data, non-admin), edge values.

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
