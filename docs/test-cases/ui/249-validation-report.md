# Test cases - Validation report panel

| Field        | Value                          |
| ------------ | ------------------------------ |
| Issue        | #249                           |
| SRS          | FR-VAL-09, FR-VAL-01..08       |
| Area         | ui                             |
| Last updated | 2026-10-25 (by the PR of #249) |

## Test data

Open `/ar/dev/pattern-viewer` (and `/en/dev/pattern-viewer`): the seed dress at size M with the real report plus two demo checks (one failure, one warning) that point at real edges and darts. The route returns 404 in production.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                          | Priority | Preconditions   | Steps                                                                         | Expected result                                                                                             | Automated by                                                                    | dev | staging |
| ------------ | ------------------------------ | -------- | --------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --- | ------- |
| TC-UI-249-01 | Row highlights and frames refs | High     | Viewer is drawn | 1. Choose the failing row. 2. Choose it again.                                | The side edge and the dart are shaded and framed; the row shows the note; choosing again clears both.       | `e2e/validation-report.spec.ts`, `ValidationReport.test.tsx`                    | ⬜  | ⬜      |
| TC-UI-249-02 | Order, icons, values, passes   | High     | Viewer is drawn | Read the panel at 360 px and desktop, in Arabic and English.                  | Failure first, then warning, passes closed; every row has an icon and a word; values in cm; no side scroll. | `report-rows.test.ts`, `ValidationReport.test.tsx`, `validation-report.spec.ts` | ⬜  | ⬜      |
| TC-UI-249-03 | Screen reader reads each row   | Medium   | A screen reader | Tab through the rows.                                                         | Each row is read as status word then message; a chosen row is "pressed".                                    | manual only                                                                     | ⬜  | ⬜      |
| TC-UI-249-04 | Arabic messages read well      | Medium   | Language Arabic | Read the panel texts (Merna reviews the engine messages; they are unchanged). | Texts are plain Arabic; plurals read right ("فشل واحد", "تنبيهان", "3 تنبيهات").                            | `ValidationReport.test.tsx`                                                     | ⬜  | ⬜      |
