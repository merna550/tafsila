# Test cases — Version history

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #252                        |
| SRS          | FR-CHAT-05                  |
| Area         | ui                          |
| Last updated | 2026-10-25 (by PR for #252) |

## Test data

A client with a size M set and a dress saved as version 1 (regular ease) and version 2 (loose ease).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                   | Priority | Preconditions                                          | Steps                                                               | Expected result                                                                                      | Automated by                                       | dev | staging |
| ------------ | --------------------------------------- | -------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --- | ------- |
| TC-UI-252-01 | List shows all saved versions           | High     | Two saved versions                                     | 1. Open the pattern page. 2. Press "Version history".               | Two rows, newest first; version 2 is marked "Current" and has no Restore button.                     | `e2e/pattern-page.spec.ts`                         | ⬜  | ⬜      |
| TC-UI-252-02 | Open an old version read only           | High     | Same                                                   | 1. Press "Open" on version 1.                                       | Banner "old version, view only", the pattern and report, inputs card; nothing editable, no Save.     | `e2e/pattern-page.spec.ts`                         | ⬜  | ⬜      |
| TC-UI-252-03 | Restore creates the next number         | High     | Same                                                   | 1. Open version 1. 2. Restore this version. 3. Confirm.             | Toast "Restored as version 3"; pattern page shows version 3 with regular ease; reload still shows 3. | `e2e/pattern-page.spec.ts`                         | ⬜  | ⬜      |
| TC-UI-252-04 | Restore with unsaved changes asks first | High     | Unsaved ease change on the page                        | 1. Go to history through the browser. 2. Restore version 1.         | The dialog says unsaved changes will be lost; Cancel changes nothing.                                | manual only                                        | ⬜  | ⬜      |
| TC-UI-252-05 | Version from an older engine            | Medium   | Set `engine_version` of version 1 to `0.0.1` in Studio | 1. Open the history. 2. Open version 1.                             | Row and read-only page show the older-engine notice.                                                 | `version-view.test.ts`, `version-history.test.tsx` | ⬜  | ⬜      |
| TC-UI-252-06 | English, 360 px width                   | Medium   | Same                                                   | 1. Switch to English. 2. Open history and an old version at 360 px. | No horizontal scroll; buttons at least 44 px; texts in English.                                      | manual only                                        | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
