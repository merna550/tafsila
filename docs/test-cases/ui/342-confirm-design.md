# Test cases — Confirm design (AI analysis)

| Field        | Value                                              |
| ------------ | -------------------------------------------------- |
| Issue        | #342                                               |
| SRS          | FR-DES-03, FR-DES-04, FR-DES-05, FR-DES-07, NFR-06 |
| Area         | ui                                                 |
| Last updated | 2026-11-03 (by PR #389)                            |

## Test data

Use the seeded accounts and records from `supabase/seed.sql` (see `docs/backend/seed-data.md`). Local and e2e runs use the fake AI provider (`AI_PROVIDER=fake`): a dress comes back with `neckline.front` at 55% confidence.

| Name | Value                                               |
| ---- | --------------------------------------------------- |
| User | `trial@tafsila.test` / `Test1234!` (3 free credits) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                         | Priority | Preconditions                      | Steps                                                                | Expected result                                                                           | Automated by                 | dev | staging |
| ------------ | --------------------------------------------- | -------- | ---------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------- | --- | ------- |
| TC-UI-342-01 | Low-confidence features must be confirmed     | High     | Analysis done with a feature < 60% | 1. Open the confirm screen. 2. Try Continue. 3. Press "Looks right". | The card is outlined with "confirm before you continue"; Continue is off until confirmed. | `e2e/confirm-design.spec.ts` | ⬜  | ⬜      |
| TC-UI-342-02 | Change a feature and see the rules notice     | High     | Confirm screen open                | 1. Change the skirt type so another feature no longer fits.          | The notice names the features changed automatically, with Undo.                           | `confirm-state.test.ts`      | ⬜  | ⬜      |
| TC-UI-342-03 | Unsupported features are listed               | Medium   | Analysis has unsupported items     | 1. Open the confirm screen.                                          | The "not supported yet" panel lists the AI text in the page language.                     | component test               | ⬜  | ⬜      |
| TC-UI-342-04 | Failed analysis                               | High     | Analysis failed                    | 1. Open `/designs/[id]/confirm`.                                     | Failed message, "Try again" and "Choose the details by hand".                             | manual only                  | ⬜  | ⬜      |
| TC-UI-342-05 | Continue opens the pattern of the same design | High     | All low features confirmed         | 1. Press Continue. 2. Save a version.                                | The pattern page shows the confirmed design; the saved version has the changes.           | `e2e/confirm-design.spec.ts` | ⬜  | ⬜      |
| TC-UI-342-06 | Reload keeps the analysis                     | Medium   | Confirm screen open                | 1. Reload.                                                           | The same features show again (confirmations restart).                                     | manual only                  | ⬜  | ⬜      |
| TC-UI-342-07 | Mobile RTL                                    | Medium   | 390 px wide, Arabic                | 1. Open the screen.                                                  | No horizontal scroll; buttons wrap; texts right to left.                                  | manual only                  | ⬜  | ⬜      |
| TC-UI-342-08 | English LTR                                   | Medium   | English                            | 1. Open the screen.                                                  | Texts left to right; counts read "2 features left to check".                              | `e2e/confirm-design.spec.ts` | ⬜  | ⬜      |
| TC-UI-342-09 | Real analysis of a dress photo                | Medium   | After #347, staging                | 1. Upload a dress photo. 2. Review the confirm screen.               | Features match the photo; unsure ones are highlighted.                                    | manual only                  | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
