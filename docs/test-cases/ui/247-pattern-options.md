# Test cases - Pattern options panel

| Field        | Value                          |
| ------------ | ------------------------------ |
| Issue        | #247                           |
| SRS          | FR-MEAS-06, FR-PAT-03          |
| Area         | ui                             |
| Last updated | 2026-10-25 (by the PR of #247) |

## Test data

A client with two measurement sets (one with a warning) and a client with none. The panel is shown on the pattern page (#251); until then these cases run once that page lands.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                         | Priority | Preconditions        | Steps                                                                  | Expected result                                                                         | Automated by                                     | dev | staging |
| ------------ | ----------------------------- | -------- | -------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------ | --- | ------- |
| TC-UI-247-01 | Open from a client profile    | High     | Client with two sets | 1. Open the pattern page with `?clientId=<id>`.                        | The client and her newest set are chosen; "Newest first" shows                          | `model/pattern-options.test.ts` (autoSelection)  | ⬜  | ⬜      |
| TC-UI-247-02 | A set with a warning          | Medium   | Set with a warning   | 1. Choose that set.                                                    | The warning shows under the dropdown in the page language                               | `components/pattern-options-components.test.tsx` | ⬜  | ⬜      |
| TC-UI-247-03 | Ease values match the engine  | High     | Panel open           | 1. Choose fitted, regular, loose.                                      | Bust, waist and hip ease in cm equal the engine table; fitted and loose say "suggested" | `components/pattern-options-components.test.tsx` | ⬜  | ⬜      |
| TC-UI-247-04 | Edit and reset seam allowance | High     | Panel open           | 1. Set the hem to 2.5. 2. Press the field's reset. 3. Press reset all. | 2.5 gives 25 mm; reset gives 3 cm; reset all restores every default                     | `model/pattern-options.test.ts`                  | ⬜  | ⬜      |
| TC-UI-247-05 | Fabric width limits           | Medium   | Panel open           | 1. Type 30, then 140.                                                  | 30 shows "between 50 and 300 cm" and is not applied; 140 clears the error               | `components/pattern-options-components.test.tsx` | ⬜  | ⬜      |
| TC-UI-247-06 | Client without sets           | Medium   | Client with no sets  | 1. Choose her.                                                         | Set dropdown disabled; a link opens the new measurements form                           | `components/pattern-options-components.test.tsx` | ⬜  | ⬜      |
| TC-UI-247-07 | Arabic and English at 360 px  | High     | Phone 360 px         | 1. Open the panel in both languages.                                   | Fields stack, nothing overflows, layout mirrors; matches the screen                     | manual only (visual baseline: #265)              | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
