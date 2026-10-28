# Test cases — Fabric recommendations (saved version)

| Field        | Value                |
| ------------ | -------------------- |
| Issue        | #319                 |
| SRS          | FR-REC-02, NFR-06    |
| Area         | ui                   |
| Last updated | 2026-10-28 (by #319) |

## Test data

Use the seeded accounts from `supabase/seed.sql` (see `docs/backend/seed-data.md`). The 16 draft fabrics come from the migration `20261028120000_fabrics.sql`.

| Name | Value                                               |
| ---- | --------------------------------------------------- |
| User | `trial@tafsila.test` / `Test1234!` (3 free credits) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                      | Priority | Preconditions                                       | Steps                                                                      | Expected result                                                                                                                         | Automated by                                              | dev | staging |
| ------------ | -------------------------- | -------- | --------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --- | ------- |
| TC-UI-319-01 | Dress recommendations      | High     | A saved dress version                               | 1. Open the version page.                                                  | "Recommended fabrics" shows 3 to 5 cards: name, small name in the other language, one-line reason, meters; first card marked "Best fit" | `e2e/fabric-recommend.spec.ts`, `fabric-panel.test.tsx`   | ⬜  | ⬜      |
| TC-UI-319-02 | Skirt recommendations      | High     | A saved skirt version                               | 1. Open the version page.                                                  | Same as 01 for the skirt                                                                                                                | `e2e/fabric-recommend.spec.ts`                            | ⬜  | ⬜      |
| TC-UI-319-03 | Blouse recommendations     | High     | A saved blouse version                              | 1. Open the version page.                                                  | Same as 01 for the blouse (at least 3 cards)                                                                                            | `e2e/fabric-recommend.spec.ts`                            | ⬜  | ⬜      |
| TC-UI-319-04 | English, left to right     | Medium   | Language set to English                             | 1. Open the version page.                                                  | Names, reasons and labels in English, layout left to right, Arabic name shown small                                                     | `fabric-panel.test.tsx`                                   | ⬜  | ⬜      |
| TC-UI-319-05 | Mobile, Arabic             | Medium   | 390px wide                                          | 1. Open the version page in Arabic.                                        | One card per row, no horizontal scroll, mirrored layout                                                                                 | manual only (screenshots in `screenshots/319/`)           | ⬜  | ⬜      |
| TC-UI-319-06 | Server error               | Medium   | The recommend call fails                            | 1. Block `/api/fabrics/recommend`, 2. open the page, 3. press "Try again". | An error state with a retry button; after the call works the cards appear                                                               | `FabricRecommendations.test.tsx`                          | ⬜  | ⬜      |
| TC-UI-319-07 | Draft note                 | Medium   | Catalogue rows still draft                          | 1. Open the version page.                                                  | A "Draft" note is shown; it is hidden when no row is draft                                                                              | `fabric-panel.test.tsx`                                   | ⬜  | ⬜      |
| TC-UI-319-08 | Avoid list and empty state | Medium   | A design that excludes a fabric / no fabric matches | 1. Open the version page.                                                  | The "Better avoided" card lists each fabric with its reason; with no match the empty state offers no cards                              | `fabric-panel.test.tsx`, `FabricRecommendations.test.tsx` | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
