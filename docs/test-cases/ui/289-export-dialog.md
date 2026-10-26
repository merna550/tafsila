# Test cases — Export dialog (A4 PDF and SVG)

| Field        | Value                          |
| ------------ | ------------------------------ |
| Issue        | #289                           |
| SRS          | FR-EXP-01, FR-EXP-03           |
| Area         | ui                             |
| Last updated | 2026-10-26 (by the PR of #289) |

## Test data

Use the seeded accounts and records from `supabase/seed.sql` (see `docs/backend/seed-data.md`).

| Name    | Value                                                                          |
| ------- | ------------------------------------------------------------------------------ |
| User    | `trial@tafsila.test` / `Test1234!`                                             |
| Version | A dress saved from the seeded client's size M, opened from the version history |

Print accuracy of the PDF is checked on paper in #295, not here.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                          | Priority | Preconditions                   | Steps                                                               | Expected result                                                                                                             | Automated by                                      | dev | staging |
| ------------ | ------------------------------ | -------- | ------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --- | ------- |
| TC-UI-289-01 | A4 download and open           | High     | A saved version is open         | 1. Press Export. 2. Keep A4. 3. Press Export.                       | Progress shows "N of M pages", then the file downloads as `<title>-v<N>-A4.pdf`; the PDF opens; page 1 has the 10 cm square | `e2e/export-dialog.spec.ts`                       | ⬜  | ⬜      |
| TC-UI-289-02 | SVG opens in a browser         | Medium   | Same                            | 1. Export. 2. Choose SVG. 3. Export. 4. Open the file in a browser. | `<title>-v<N>.svg` downloads and shows all pieces at real size                                                              | `e2e/export-dialog.spec.ts`                       | ⬜  | ⬜      |
| TC-UI-289-03 | File name with an Arabic title | Medium   | A design titled with Arabic     | Export A4.                                                          | The name keeps the Arabic letters, spaces become dashes, no `/ : * ?`                                                       | `shared/pattern-export/file-name.test.ts`         | ⬜  | ⬜      |
| TC-UI-289-04 | Cancel while building          | High     | Throttle the network            | 1. Export A4. 2. Press Cancel while the bar moves.                  | The dialog returns to the options; nothing downloads; Export works again                                                    | `e2e/export-dialog.spec.ts`                       | ⬜  | ⬜      |
| TC-UI-289-05 | Font blocked or offline        | High     | Block `/fonts/*` in the browser | 1. Export A4.                                                       | Alert "The font could not be loaded..."; Try again works once the font loads                                                | `e2e/export-dialog.spec.ts`                       | ⬜  | ⬜      |
| TC-UI-289-06 | Phone 360 px                   | Medium   | 360 px wide screen              | Open the dialog in every state.                                     | No horizontal scroll; buttons are at least 44 px; text is readable                                                          | `e2e/export-dialog.spec.ts` (overflow)            | ⬜  | ⬜      |
| TC-UI-289-07 | Keyboard only                  | Medium   | Same                            | Tab to Export, Enter, arrow keys between options, Enter, Esc.       | Focus is trapped in the dialog; Esc closes it and focus returns to the Export button                                        | `e2e/export-dialog.spec.ts`                       | ⬜  | ⬜      |
| TC-UI-289-08 | English                        | Low      | Language set to English         | Open the dialog in every state.                                     | All texts are English, the layout is left to right                                                                          | `features/pattern-export/pattern-export.test.tsx` | ⬜  | ⬜      |
| TC-UI-289-09 | Safari on iPhone               | Low      | iPhone                          | Export A4.                                                          | The PDF may open in a tab instead of downloading; "Download again" in the dialog still works                                | manual only                                       | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
