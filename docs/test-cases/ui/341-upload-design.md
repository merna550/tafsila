# Test cases — Upload photos and analysing screens

| Field        | Value                                        |
| ------------ | -------------------------------------------- |
| Issue        | #341                                         |
| SRS          | FR-DES-01, FR-DES-02, NFR-02, NFR-05, NFR-06 |
| Area         | ui                                           |
| Last updated | 2026-11-02 (by PR #362)                      |

## Test data

Use the seeded accounts from `supabase/seed.sql` (see `docs/backend/seed-data.md`).

| Name | Value                                               |
| ---- | --------------------------------------------------- |
| User | `trial@tafsila.test` / `Test1234!` (3 free credits) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                      | Priority | Preconditions               | Steps                                                                                                  | Expected result                                                                                  | Automated by                                                                                                         | dev | staging |
| ------------ | -------------------------- | -------- | --------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | --- | ------- |
| TC-UI-341-01 | Front photo only           | High     | Signed in                   | 1. Open /designs/new, press From a photo. 2. Pick a category. 3. Add one JPG. 4. Press Start analysis. | The photo is labelled front, the analysing screen opens and ends on the done state               | `e2e/upload-design.spec.ts`                                                                                          | ⬜  | ⬜      |
| TC-UI-341-02 | Three photos               | High     | Signed in                   | 1. Add three photos at once, then try a fourth.                                                        | Slots front, back, side; the Add tile disappears; a fourth shows the limit message               | `components/upload-design-components.test.tsx`, `model/photo-slots.test.ts`                                          | ⬜  | ⬜      |
| TC-UI-341-03 | HEIC                       | Medium   | Safari and Chrome           | 1. Add an iPhone HEIC photo in each browser.                                                           | Safari prepares it as JPEG; Chrome shows the message to share it as JPEG and keeps Start off     | `model/photo-rules.test.ts`, `shared/image-prepare/prepare-image.test.ts` (stubbed decoder); manual only in browsers | ⬜  | ⬜      |
| TC-UI-341-04 | GPS removed                | High     | A phone photo with location | 1. Add it and start. 2. Inspect the stored object (exiftool).                                          | No EXIF block, long edge at most 1600 px                                                         | `e2e/upload-design.spec.ts`                                                                                          | ⬜  | ⬜      |
| TC-UI-341-05 | Oversize file              | High     | Signed in                   | 1. Add a 12 MB file.                                                                                   | The size message shows and Start stays disabled                                                  | `e2e/upload-design.spec.ts`, `model/photo-rules.test.ts`                                                             | ⬜  | ⬜      |
| TC-UI-341-06 | Network drop during upload | Medium   | Signed in                   | 1. Start, switch the network off during the upload, switch it on. 2. Press Start analysis again.       | The photo shows the upload error; the second press reuses the design and uploads only that photo | `hooks/start-analysis.test.ts`; manual for the real network                                                          | ⬜  | ⬜      |
| TC-UI-341-07 | Analysing is slow          | Medium   | Analysis taking over 45 s   | 1. Stay on the analysing screen.                                                                       | After 45 s the note offers waiting or choosing the details by hand                               | `model/analysis-view.test.ts`, `components/upload-design-components.test.tsx`                                        | ⬜  | ⬜      |
| TC-UI-341-08 | Failed analysis            | High     | Provider failing            | 1. Start with the provider failing.                                                                    | Failure message, Try again and the manual link; Try again polls again                            | `components/upload-design-components.test.tsx`                                                                       | ⬜  | ⬜      |
| TC-UI-341-09 | Mobile RTL                 | Medium   | Phone width, Arabic         | 1. Open both screens at 390 px.                                                                        | No horizontal scroll, mirrored layout, buttons at least 44 px                                    | manual only (screenshots in the PR)                                                                                  | ⬜  | ⬜      |
| TC-UI-341-10 | English LTR                | Medium   | English                     | 1. Open both screens in English.                                                                       | All text in English, no Arabic left                                                              | `e2e/upload-design.spec.ts` (en projects)                                                                            | ⬜  | ⬜      |
| TC-UI-341-11 | Pants                      | Low      | Signed in                   | 1. Look at the category cards.                                                                         | Pants shows coming soon and cannot be chosen                                                     | `model/category-choice.test.ts`                                                                                      | ⬜  | ⬜      |
| TC-UI-341-12 | Real analysis on staging   | High     | After #347, real provider   | 1. Run a real photo through the flow.                                                                  | Done state with suggestions                                                                      | manual only                                                                                                          | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
