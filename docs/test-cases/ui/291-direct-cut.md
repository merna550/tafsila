# Test cases - Direct-cut checklist

| Field        | Value                           |
| ------------ | ------------------------------- |
| Issue        | #291                            |
| SRS          | FR-CUT-01, FR-CUT-02, FR-CUT-03 |
| Area         | ui                              |
| Last updated | 2026-10-26 (by the PR of #291)  |

## Test data

A signed-in user with a saved version of a dress. Open it from the version history, then press "Direct cut". For print cases use Chrome and Safari print preview. **Cutting a toile from the steps is #296, not here.**

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                        | Priority | Preconditions                | Steps                                                                                 | Expected result                                                                                                          | Automated by                      | dev | staging |
| ------------ | ---------------------------- | -------- | ---------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------- | --- | ------- |
| TC-UI-291-01 | Open from a saved version    | High     | A saved version              | 1. Open the version. 2. Press "Direct cut" in the "use this version" bar.             | The checklist opens with the pieces, the reference text and numbered steps; the header shows version and engine version. | `e2e/direct-cut.spec.ts`          | ⬜  | ⬜      |
| TC-UI-291-02 | Tick and reload              | High     | Checklist open               | 1. Tick two steps. 2. Reload.                                                         | The two steps stay ticked and the piece shows "2 of N".                                                                  | `e2e/direct-cut.spec.ts`          | ⬜  | ⬜      |
| TC-UI-291-03 | Curve point spacing          | High     | Checklist open               | 1. Tick a step. 2. Choose 30 mm. 3. Choose 25 mm again.                               | At 30 mm the list is different and unticked; at 25 mm the first ticks are back.                                          | `e2e/direct-cut.spec.ts`          | ⬜  | ⬜      |
| TC-UI-291-04 | Print preview                | High     | Two steps ticked             | 1. Press "Print view". 2. Press "Print" and look at the preview in Chrome and Safari. | One piece per page, empty boxes whatever was ticked, version and engine version printed, curve reference drawn.          | `e2e/direct-cut.spec.ts` (partly) | ⬜  | ⬜      |
| TC-UI-291-05 | 360 px phone in Arabic       | High     | Phone or 360 px window       | 1. Open the checklist in Arabic.                                                      | No sideways scrolling; the piece list, steps and drawing stack; boxes are easy to tap.                                   | `e2e/direct-cut.spec.ts`          | ⬜  | ⬜      |
| TC-UI-291-06 | English                      | Medium   | Language set to English      | 1. Open the checklist.                                                                | Texts are English, layout is left to right, numbers are Western.                                                         | `e2e/direct-cut.spec.ts` (en)     | ⬜  | ⬜      |
| TC-UI-291-07 | Clear ticks                  | Medium   | Steps ticked                 | 1. Press "Clear ticks". 2. Cancel, then do it again and confirm.                      | Cancel keeps the ticks; confirm empties them.                                                                            | `e2e/direct-cut.spec.ts`          | ⬜  | ⬜      |
| TC-UI-291-08 | Version that cannot be drawn | Medium   | A version the engine rejects | 1. Open it.                                                                           | "Direct cut" is disabled and says why.                                                                                   | `direct-cut.test.tsx`             | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
