# Test cases — Mini admin screens (Part B)

| Field        | Value                         |
| ------------ | ----------------------------- |
| Issue        | #32 (Part B: web)             |
| SRS          | FR-MEAS-01, FR-ADM-02         |
| Area         | ui                            |
| Last updated | 2026-10-14 (by PR for #32, B) |

## Test data

Seeded accounts (`supabase/seed.sql`, see `docs/backend/seed-data.md`): `admin@tafsila.test` (admin), `trial@tafsila.test` (normal user), password `Test1234!`. The seeded chart is the PLACEHOLDER chart (S to XXL).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                       | Priority | Preconditions      | Steps                                                              | Expected result                                                                                           | Automated by                                  | dev | staging |
| ------------ | --------------------------- | -------- | ------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | --------------------------------------------- | --- | ------- |
| TC-ADM-32-20 | Signed-out visitor          | High     | Signed out         | Open `/admin/users`                                                | Sent to sign-in with `next`                                                                               | `e2e/admin.spec.ts`, `access-guard.test.ts`   | ⬜  | ⬜      |
| TC-ADM-32-21 | Normal user gets 404        | High     | Signed in as user  | Open `/admin/users`; look at the top bar                           | Design-system "page not found"; no "الإدارة" link anywhere                                                | `e2e/admin.spec.ts`                           | ⬜  | ⬜      |
| TC-ADM-32-22 | Admin link and users screen | High     | Signed in as admin | Click "الإدارة" in the top bar                                     | `/admin/users` with four stat tiles, search, filter, table and the privacy note                           | `e2e/admin.spec.ts`                           | ⬜  | ⬜      |
| TC-ADM-32-23 | Search and verified filter  | High     | Admin              | Type `pro@tafsila`; type nonsense; clear; press "الرقم مؤكَّد"     | One row; "no results" with a clear button; the pressed filter changes (`aria-pressed`)                    | `e2e/admin.spec.ts`                           | ⬜  | ⬜      |
| TC-ADM-32-24 | Table in RTL                | Medium   | Admin, Arabic      | Look at the table                                                  | E-mail and phone read left-to-right inside the RTL row; badge shows مؤكَّد / غير مؤكَّد                   | manual only                                   | ⬜  | ⬜      |
| TC-ADM-32-25 | User detail is read-only    | Medium   | Admin              | Click a user's name                                                | Counts, language and role; no inputs; no measurements or notes                                            | `e2e/admin.spec.ts`                           | ⬜  | ⬜      |
| TC-ADM-32-26 | Dirty and invalid cells     | High     | Admin              | Open `/admin/sizes`; edit a cell; type `abc`; restore the value    | Edited cell is peach and the save button counts it; `abc` is red with `aria-invalid` and save is disabled | `e2e/admin.spec.ts`, `size-grid.test.ts`      | ⬜  | ⬜      |
| TC-ADM-32-27 | Engine rule blocks saving   | High     | Admin              | Set high bust of M above its bust                                  | Cells red, the sentence is listed under the grid, save disabled                                           | `size-grid.test.ts`                           | ⬜  | ⬜      |
| TC-ADM-32-28 | Save and reload             | High     | Admin              | Change shoulder width of S by 0.5; save; reload; put it back; save | Toast "تم حفظ جدول المقاسات"; the value survives the reload                                               | `e2e/admin.spec.ts`                           | ⬜  | ⬜      |
| TC-ADM-32-29 | Discard asks first          | Medium   | Admin              | Edit a cell; press "تجاهل التعديلات"; confirm                      | Dialog asks; the saved value comes back                                                                   | `e2e/admin.spec.ts`                           | ⬜  | ⬜      |
| TC-ADM-32-30 | Placeholder banner          | Medium   | Seeded chart       | Open `/admin/sizes`                                                | "مؤقت" banner shown; it disappears after importing a file with a new chart name                           | manual only                                   | ⬜  | ⬜      |
| TC-ADM-32-31 | CSV export                  | High     | Admin              | Press "تصدير CSV"                                                  | File starts `measurement,S,M,L,XL,XXL`; 18 rows in cm                                                     | `e2e/admin.spec.ts`, `size-chart-csv.test.ts` | ⬜  | ⬜      |
| TC-ADM-32-32 | CSV import: broken file     | High     | Admin              | Import a file whose first cell is `name`                           | Problem list with line numbers; "استيراد وحفظ" disabled                                                   | `e2e/admin.spec.ts`, `size-chart-csv.test.ts` | ⬜  | ⬜      |
| TC-ADM-32-33 | CSV import: round trip      | High     | Admin              | Import the exported file                                           | "The file is fine" with the sizes; confirm enabled; saving keeps the chart                                | `e2e/admin.spec.ts`                           | ⬜  | ⬜      |
| TC-ADM-32-34 | CSV edge formats            | Medium   | Admin              | Import a semicolon file with `84,5`, Arabic-Indic digits and a BOM | Read as 84.5 cm                                                                                           | `size-chart-csv.test.ts`                      | ⬜  | ⬜      |
| TC-ADM-32-35 | Leaving with unsaved edits  | Low      | Admin              | Edit a cell; close the tab                                         | Browser asks before leaving                                                                               | manual only                                   | ⬜  | ⬜      |
| TC-ADM-32-36 | Mobile width (390 px)       | Medium   | Admin              | Open both screens at 390 px                                        | No page-level horizontal scroll; the table and grid scroll inside their box                               | manual only                                   | ⬜  | ⬜      |
| TC-ADM-32-37 | Stale admin token           | Medium   | Role just removed  | Remove the admin role in SQL; use the open page                    | API answers 403 (Part A); the page shows the error state; after token refresh the area is 404             | manual only                                   | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
