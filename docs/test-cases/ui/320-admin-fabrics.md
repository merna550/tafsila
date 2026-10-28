# Test cases — Admin fabric catalogue and rules

| Field        | Value                |
| ------------ | -------------------- |
| Issue        | #320                 |
| SRS          | FR-REC-03, FR-ADM-02 |
| Area         | ui                   |
| Last updated | 2026-10-28 (by #320) |

## Test data

Use the seeded accounts from `supabase/seed.sql` (see `docs/backend/seed-data.md`). The 16 draft fabrics and the draft rules come from the migration `20261028120000_fabrics.sql`.

| Name  | Value                              |
| ----- | ---------------------------------- |
| Admin | `admin@tafsila.test` / `Test1234!` |
| User  | any normal account (not an admin)  |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                    | Priority | Preconditions                 | Steps                                                                                                            | Expected result                                                                                                            | Automated by                                           | dev | staging |
| ------------ | ------------------------ | -------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --- | ------- |
| TC-UI-320-01 | Add a fabric             | High     | Signed in as admin            | 1. Open "Fabrics and rules". 2. Press "New fabric". 3. Fill the id, both names, care notes, properties. 4. Save. | Back on the list; the new fabric is there with a "Draft" tag unless "reviewed" was ticked                                  | `e2e/admin-fabrics.spec.ts`                            | ⬜  | ⬜      |
| TC-UI-320-02 | Edit a fabric            | High     | A saved version of any design | 1. Open a fabric. 2. Change its Arabic name. 3. Save. 4. Open the saved version's recommendations.               | The new name shows in the recommendations (the cached list was refreshed)                                                  | `e2e/admin-fabrics.spec.ts`, `admin-fabrics.test.tsx`  | ⬜  | ⬜      |
| TC-UI-320-03 | Delete a fabric          | High     | A fabric you added            | 1. Press "Delete" on its row. 2. Confirm.                                                                        | The confirmation names the fabric; after confirming it is gone from the list; "Keep it" leaves it                          | `e2e/admin-fabrics.spec.ts`                            | ⬜  | ⬜      |
| TC-UI-320-04 | Edit a rule              | High     | Signed in as admin            | 1. Open the "Rules" tab. 2. Press "Edit" on a rule. 3. Change a condition value and the priority. 4. Save.       | The list shows the change; the condition can only use paths and values from the lists; changing the path clears the values | `e2e/admin-fabrics.spec.ts`, `components.test.tsx`     | ⬜  | ⬜      |
| TC-UI-320-05 | Preview before saving    | High     | The rule dialog is open       | 1. Pick a sample design. 2. Make the rule stricter (a "required" maximum of 1 on weight).                        | "With this edit" differs from "Saved rules" and the verdict says the edit changes the recommendations; nothing is saved    | `e2e/admin-fabrics.spec.ts`, `preview.test.ts`         | ⬜  | ⬜      |
| TC-UI-320-06 | Non-admin gets not-found | High     | Signed in as a normal user    | 1. Open `/admin/fabrics` and `/admin/fabric-rules`.                                                              | The "not found" page, no admin text                                                                                        | `e2e/admin-fabrics.spec.ts`                            | ⬜  | ⬜      |
| TC-UI-320-07 | Audit row after a save   | Medium   | Database access               | 1. Save a fabric. 2. Query the audit table.                                                                      | A row with the admin id, the old and the new value                                                                         | manual only (API side: `routes/admin-fabrics.test.ts`) | ⬜  | ⬜      |
| TC-UI-320-08 | Mobile, Arabic           | Medium   | 390px wide                    | 1. Open the list, the form and the rule dialog in Arabic.                                                        | No horizontal page scroll (the table scrolls inside its box), mirrored layout, buttons at least 44px                       | manual only (screenshots in `screenshots/320/`)        | ⬜  | ⬜      |
| TC-UI-320-09 | Validation               | Medium   | The fabric form               | 1. Clear the English name. 2. Save. 3. Use an id with capitals on a new fabric.                                  | Messages under the fields, nothing sent; a duplicate id shows the API message under the id                                 | `fabric-form.test.ts`, `admin-fabrics.test.tsx`        | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
