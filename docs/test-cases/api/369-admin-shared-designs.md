# Test cases — Admin shared designs and unsupported features

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #369                        |
| SRS          | FR-ADM-03                   |
| Area         | api                         |
| Last updated | 2026-11-03 (by PR for #369) |

## Test data

| Name  | Value                                                            |
| ----- | ---------------------------------------------------------------- |
| Admin | `admin@tafsila.test` / `Test1234!`                               |
| Owner | `pro@tafsila.test` (consents, has the design `Pro shared dress`) |
| Other | `trial@tafsila.test` (does not consent)                          |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                              | Priority | Preconditions                  | Steps                                                                                                     | Expected result                                                                                 | Automated by                          | dev | staging |
| ------------- | ---------------------------------- | -------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------- | --- | ------- |
| TC-API-369-01 | Admin sees only consenting designs | High     | Seeded accounts                | 1. `GET /api/admin/designs` as admin 2. PATCH `/api/profile` `{shareDesigns:false}` as owner 3. GET again | Step 1 lists `Pro shared dress` with spec and photos, no measurement keys; step 3 lists nothing | `routes/admin-designs.test.ts`, pgTAP | ⬜  | ⬜      |
| TC-API-369-02 | Non-admin is refused               | High     | Signed in as a normal user     | 1. `GET /api/admin/designs` 2. `GET /api/admin/unsupported-features`                                      | Both answer 403 `FORBIDDEN`                                                                     | `routes/admin-designs.test.ts`, pgTAP | ⬜  | ⬜      |
| TC-API-369-03 | Unsupported features are anonymous | High     | A recorded unsupported feature | 1. `GET /api/admin/unsupported-features` as admin                                                         | Text, category and time only; no user or design id; an `admin_audit` row is written             | `routes/admin-designs.test.ts`, pgTAP | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
