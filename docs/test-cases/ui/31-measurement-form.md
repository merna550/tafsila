# Test cases — Measurement form and guide

| Field        | Value                              |
| ------------ | ---------------------------------- |
| Issue        | #31                                |
| SRS          | FR-MEAS-01, FR-MEAS-02, FR-MEAS-05 |
| Area         | ui                                 |
| Last updated | 2026-10-13 (by PR for issue #31)   |

## Test data

Seeded accounts from `supabase/seed.sql` (see `docs/backend/seed-data.md`). The default size chart (S-XXL, demo values) comes from a migration, so every environment has it.

| Name           | Value                                                |
| -------------- | ---------------------------------------------------- |
| User with data | `pro@tafsila.test` / `Test1234!` (clients with sets) |
| Other user     | `trial@tafsila.test` / `Test1234!`                   |
| Size M (cm)    | bust 92, high bust 86, waist 74, hip 100             |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID          | Title                           | Priority | Preconditions         | Steps                                                               | Expected result                                                                                                  | Automated by                                                              | dev | staging |
| ----------- | ------------------------------- | -------- | --------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --- | ------- |
| TC-UI-31-01 | Save from a size                | High     | A client              | 1. New measurements 2. Name "صيف 2026" 3. Pick M 4. Save            | All 18 boxes filled from M; profile opens with the set and "Based on size M"; toast                              | `e2e/measurements.spec.ts`                                                | ⬜  | ⬜      |
| TC-UI-31-02 | Size plus one override          | High     | A client              | 1. Pick M 2. Change the waist to 76                                 | "معدَّل" next to the waist and "العودة إلى قيمة M (74)"; other boxes unmarked; saves with size label M           | `e2e/measurements.spec.ts`, `model/overrides.test.ts`                     | ⬜  | ⬜      |
| TC-UI-31-03 | Fully custom                    | High     | A client              | 1. Open "مقاسات مخصّصة" 2. Fill every box 3. Save                   | Save disabled until all required boxes are valid; saved with no size label ("Custom measurements")               | `e2e/measurements.spec.ts`                                                | ⬜  | ⬜      |
| TC-UI-31-04 | An error blocks saving          | High     | Size M picked         | 1. Set high bust to 95 (bust 92)                                    | Red message under the box, save disabled, "يوجد خطأ واحد يجب تصحيحه قبل الحفظ"                                   | `e2e/measurements.spec.ts`, `model/issues.test.ts`                        | ⬜  | ⬜      |
| TC-UI-31-05 | A warning does not block        | High     | Size M picked         | 1. Set waist to 105 (hip 100)                                       | Amber message with the explanation; save stays enabled; the set saves                                            | `e2e/measurements.spec.ts`                                                | ⬜  | ⬜      |
| TC-UI-31-06 | Reset to size                   | High     | Waist adjusted        | 1. Click the reset link                                             | The waist shows 74 again and the "adjusted" mark goes                                                            | `e2e/measurements.spec.ts`, `components/measurement-components.test.tsx`  | ⬜  | ⬜      |
| TC-UI-31-07 | Every guide opens (ar and en)   | High     | Form open             | 1. Click "كيف أقيس؟" on each of the 18 boxes, in Arabic and English | Drawing, 3-4 steps and a warning box; no field without text                                                      | `components/measurement-components.test.tsx`, `model/guide-index.test.ts` | ⬜  | ⬜      |
| TC-UI-31-08 | Next measurement in the guide   | Medium   | Guide open on bust    | 1. Click "القياس التالي"                                            | The guide shows high bust; on the last measurement the button is gone                                            | `e2e/measurements.spec.ts`, `model/guide-index.test.ts`                   | ⬜  | ⬜      |
| TC-UI-31-09 | Arabic-Indic digits             | Medium   | Custom mode           | 1. Type ٩٢٫٥ in the bust box                                        | Accepted as 92.5 cm and saved as 925 mm                                                                          | `e2e/measurements.spec.ts`, `model/units.test.ts`                         | ⬜  | ⬜      |
| TC-UI-31-10 | Decimal and bad input           | Medium   | Custom mode           | 1. Type 92.55 2. Type "abc" 3. Leave a required box empty           | Messages "one decimal is enough" and "enter a number"; empty required box shows "أدخل هذا القياس" after touching | `model/units.test.ts`, `model/measurement-form.schema.test.ts`            | ⬜  | ⬜      |
| TC-UI-31-11 | Edit a saved set                | High     | A saved set on size M | 1. Open the set from the profile 2. Change a value 3. Save          | Boxes hold the saved values, changed ones are marked; profile shows the change                                   | `e2e/measurements.spec.ts`                                                | ⬜  | ⬜      |
| TC-UI-31-12 | Another user's set or client    | High     | Two users             | 1. Copy the edit URL 2. Open it as the other user                   | Not-found page, no data                                                                                          | `packages/api/src/services/measurement-sets.test.ts`                      | ⬜  | ⬜      |
| TC-UI-31-13 | Mobile 390 px, Arabic           | High     | Phone-size window     | 1. Open the form and a guide                                        | No horizontal scroll, boxes one per row, controls at least 44 px, dialog fits the screen                         | `e2e/measurements.spec.ts` (screenshots with `E2E_SCREENSHOTS=1`)         | ⬜  | ⬜      |
| TC-UI-31-14 | English, left to right          | Medium   | -                     | 1. Open `/en/clients/<id>/measurements/new`                         | English texts, left to right, "Reset to M (74)", guide in English                                                | `e2e/measurements.spec.ts`                                                | ⬜  | ⬜      |
| TC-UI-31-15 | Folded groups keep their values | Medium   | Form open             | 1. Change an arm value 2. Fold and reopen "الذراعان" 3. Save        | The value is kept and saved; a group with a problem cannot be folded away                                        | `components/measurement-components.test.tsx`                              | ⬜  | ⬜      |
| TC-UI-31-16 | Server rejects the values       | Low      | API returns 422       | 1. Save a set the browser accepted but the server rejects           | A toast with the server's bilingual message; the form keeps its values                                           | manual only                                                               | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
