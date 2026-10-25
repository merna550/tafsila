# Test cases — Pattern page

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #251                        |
| SRS          | FR-PAT-04, FR-VAL-09        |
| Area         | ui                          |
| Last updated | 2026-10-25 (by PR for #251) |

## Test data

| Name   | Value                                                          |
| ------ | -------------------------------------------------------------- |
| User   | a fresh account (the e2e creates one) or the seeded trial user |
| Client | "Salma Adel" with one measurement set from size M              |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                               | Priority | Preconditions              | Steps                                                                               | Expected result                                                                              | Automated by                                    | dev | staging |
| ------------ | ----------------------------------- | -------- | -------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------- | --- | ------- |
| TC-UI-251-01 | Dress from a client, save, reload   | High     | Client with a size M set   | 1. New pattern, dress. 2. Sleeve: puff. 3. View pattern. 4. Save version. 5. Reload | Pieces drawn, report pass or warn; "Saved", "Version 1"; Save disabled; sleeve is still puff | `e2e/pattern-page.spec.ts`                      | ⬜  | ⬜      |
| TC-UI-251-02 | Measurements changed in another tab | High     | A saved version            | 1. Edit the set's waist in another tab. 2. Reopen the pattern page                  | Badge "Changed since version N"; Save enabled; hint explains                                 | `model/save-state.test.ts` (manual for the tab) | ⬜  | ⬜      |
| TC-UI-251-03 | Leave with unsaved changes          | Medium   | Unsaved change on the page | 1. Change the ease. 2. Close or reload the tab                                      | The browser asks before leaving; nothing asked after saving                                  | manual only                                     | ⬜  | ⬜      |
| TC-UI-251-04 | Phone 360 px                        | High     | Saved or new design        | 1. Open the page at 360 px                                                          | Viewer on top, tabs panel below; no horizontal page scroll; Save reachable                   | manual only (visual: follow-up #265)            | ⬜  | ⬜      |
| TC-UI-251-05 | Typing fast on a slow phone         | Medium   | Throttled CPU              | 1. Change options quickly several times                                             | Page stays responsive; the drawing dims with "Updating the pattern..." then updates          | manual only                                     | ⬜  | ⬜      |
| TC-UI-251-06 | English                             | Medium   | Language set to English    | 1. Repeat 01 in English                                                             | Labels in English; drawing not mirrored; layout mirrored                                     | `e2e/pattern-page.spec.ts` (en projects)        | ⬜  | ⬜      |
| TC-UI-251-07 | Failed report disables Save         | High     | A failing combination      | 1. Choose a combination whose report fails                                          | Badge "Check failed"; Save disabled; hint "fix the problems first"                           | `components/pattern-page.test.tsx`              | ⬜  | ⬜      |
| TC-UI-251-08 | Server refuses (422)                | High     | Stubbed 422                | 1. Press Save while the server answers 422 with a report                            | Banner "The server found a problem"; its report listed; Save disabled until an input changes | `e2e/pattern-page.spec.ts`                      | ⬜  | ⬜      |
| TC-UI-251-09 | No measurement set                  | Medium   | Design with no client yet  | 1. Open the page for a new design without `?clientId=`                              | "No pattern yet" card and the Options tab open; Save hidden reason: choose measurements      | manual only                                     | ⬜  | ⬜      |

Every case covers one of: happy path, validation/errors, RTL/Arabic display, mobile width.

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
