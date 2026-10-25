# Test cases - Picker sections and length overrides

| Field        | Value                          |
| ------------ | ------------------------------ |
| Issue        | #246                           |
| SRS          | FR-DES-06, FR-DES-05           |
| Area         | ui                             |
| Last updated | 2026-10-25 (by the PR of #246) |

## Test data

Any confirmed account; start a dress from `/designs/new`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID               | Title                          | Priority | Preconditions            | Steps                                                  | Expected result                                                                       | Automated by                                          | dev | staging |
| ---------------- | ------------------------------ | -------- | ------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------- | --- | ------- |
| TC-DESIGN-246-01 | Every section on a dress       | High     | New dress open           | Open each section and pick a card in each              | The card is selected; the step shows as changed; ar and en at 360 px match the design | `section-panel.test.tsx`, `e2e/design-picker.spec.ts` | ⬜  | ⬜      |
| TC-DESIGN-246-02 | Skirt sections                 | High     | New skirt open           | Open Skirt; pick each type and length                  | Cards select; no bodice, neckline or sleeve step                                      | `section-panel.test.tsx`                              | ⬜  | ⬜      |
| TC-DESIGN-246-03 | Refused value shows its reason | High     | Dress with no waist seam | Open Skirt                                             | "Gathered" is disabled with the reason; clicking does nothing                         | `section-panel.test.tsx`                              | ⬜  | ⬜      |
| TC-DESIGN-246-04 | Length override in cm          | High     | Dress open               | Neckline: type 9 in neck depth; type 99; clear the box | 9 is kept (90 mm); 99 shows the range error and is not saved; empty removes it        | `length-units.test.ts`, `e2e/design-picker.spec.ts`   | ⬜  | ⬜      |
| TC-DESIGN-246-05 | Slit and its length            | Medium   | Straight skirt open      | Choose a back slit; set its length; choose "no slit"   | The slit length box appears with a slit and disappears without one                    | `section-panel.test.tsx`                              | ⬜  | ⬜      |
| TC-DESIGN-246-06 | RTL arrows and keyboard        | Medium   | Any section              | Use arrow keys in a card group in Arabic and English   | Focus moves in reading direction; Enter chooses                                       | manual only                                           | ⬜  | ⬜      |
| TC-DESIGN-246-07 | Pockets multi-select           | Medium   | Dress open               | Open Pockets; toggle both cards                        | Each toggles on and off independently                                                 | `section-panel.test.tsx`                              | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
