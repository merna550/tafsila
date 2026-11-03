# Test cases — Chat panel on the pattern page

| Field        | Value                                                  |
| ------------ | ------------------------------------------------------ |
| Issue        | #344                                                   |
| SRS          | FR-CHAT-01, FR-CHAT-03, FR-CHAT-04, FR-CHAT-06, NFR-06 |
| Area         | ui                                                     |
| Last updated | 2026-11-03 (by PR #394)                                |

## Test data

Use the seeded accounts and records from `supabase/seed.sql` (see `docs/backend/seed-data.md`). Local and e2e runs use the fake AI provider (`AI_PROVIDER=fake`): "add side pockets" gives a pockets proposal, "make it a jumpsuit" an unsupported answer with a suggestion. The e2e allows 3 messages per design (`CHAT_MESSAGES_PER_DESIGN=3`).

| Name | Value                                               |
| ---- | --------------------------------------------------- |
| User | `trial@tafsila.test` / `Test1234!` (3 free credits) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                 | Priority | Preconditions                  | Steps                                                  | Expected result                                                                                      | Automated by            | dev | staging |
| ------------ | ------------------------------------- | -------- | ------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------- | --- | ------- |
| TC-UI-344-01 | Supported edit becomes a proposal     | High     | A dress with a saved version   | 1. Open the Assistant tab. 2. Send "add side pockets". | A proposal card lists the changes with Apply and Dismiss; the pattern is unchanged.                  | `e2e/chat-edit.spec.ts` | ⬜  | ⬜      |
| TC-UI-344-02 | Unsupported request with a suggestion | High     | Same                           | 1. Send "make it a jumpsuit".                          | A polite "not supported yet" card with the closest option as a button that sends it as a message.    | `e2e/chat-edit.spec.ts` | ⬜  | ⬜      |
| TC-UI-344-03 | Dismiss a proposal                    | Medium   | A pending proposal             | 1. Press Dismiss.                                      | The card says dismissed; no version is created.                                                      | manual only             | ⬜  | ⬜      |
| TC-UI-344-04 | Apply creates version n+1             | High     | A pending proposal             | 1. Press Apply. 2. Open the version history.           | The card says "Saved as version n+1", the badge shows n+1, the history lists it as by the assistant. | `e2e/chat-edit.spec.ts` | ⬜  | ⬜      |
| TC-UI-344-05 | Quota used up                         | High     | Messages left: 0               | 1. Look at the box.                                    | The box is off and says all messages were used, with the way on (Options, or save and continue).     | `e2e/chat-edit.spec.ts` | ⬜  | ⬜      |
| TC-UI-344-06 | Stale proposal                        | Medium   | A proposal, then a new version | 1. Save another version. 2. Look at the old proposal.  | "The pattern changed since this suggestion" with "Ask again"; Apply is not offered.                  | `apply-state.test.ts`   | ⬜  | ⬜      |
| TC-UI-344-07 | No saved version                      | Medium   | A design never saved           | 1. Open the Assistant tab.                             | "Save a version first"; no box.                                                                      | `e2e/chat-edit.spec.ts` | ⬜  | ⬜      |
| TC-UI-344-08 | Arabic and English texts              | Medium   | Each language                  | 1. Open the tab in Arabic, then English.               | All texts and change lines are in the page language; counters read "Messages left: n of 10".         | component tests         | ⬜  | ⬜      |
| TC-UI-344-09 | Mobile RTL                            | Medium   | 390 px wide, Arabic            | 1. Open the tab.                                       | No horizontal scroll; the panel sits below the pattern; Enter sends, Shift+Enter adds a line.        | manual only             | ⬜  | ⬜      |
| TC-UI-344-10 | Real provider                         | Medium   | After #347, staging            | 1. Send a few real requests.                           | Proposals match the request; unsupported ones get a useful suggestion.                               | manual only             | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
