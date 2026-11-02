# Test cases — Chat edits API

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #343                       |
| SRS          | FR-CHAT-01..04, FR-CHAT-06 |
| Area         | api                        |
| Last updated | 2026-11-02 (by PR #361)    |

## Test data

Use the seeded accounts and records from `supabase/seed.sql` (see `docs/backend/seed-data.md`). The fake AI provider answers by keyword: "pocket" proposes side pockets, "longer" a long sleeve, "jumpsuit" an unsupported explanation.

| Name   | Value                              |
| ------ | ---------------------------------- |
| User   | `trial@tafsila.test` / `Test1234!` |
| Design | A dress with one saved version     |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                         | Priority | Preconditions                 | Steps                                           | Expected result                                                                   | Automated by                        | dev | staging |
| ------------- | ----------------------------- | -------- | ----------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------- | --- | ------- |
| TC-API-343-01 | Supported edit applies        | High     | Design with a saved version   | 1. POST chat "add side pockets" 2. POST apply   | 200 `proposal` with one bilingual line; apply 201, version n+1 `created_by chat`  | `routes/design-chat.test.ts`        | ⬜  | ⬜      |
| TC-API-343-02 | Unsupported request explained | High     | Same                          | 1. POST chat "make it a jumpsuit" 2. POST apply | 200 `unsupported` with text and closest option; apply 422 `CHAT_NOTHING_TO_APPLY` | `routes/design-chat.test.ts`        | ⬜  | ⬜      |
| TC-API-343-03 | Quota of 10                   | High     | Same                          | Send 11 messages                                | The 11th is 429 `CHAT_QUOTA_EXCEEDED` with `details.used` 10, `limit` 10          | `routes/design-chat.test.ts`        | ⬜  | ⬜      |
| TC-API-343-04 | Stale proposal                | High     | A proposal exists             | 1. Save another version 2. Apply the proposal   | 409 `CHAT_PROPOSAL_STALE`, no version saved                                       | `routes/design-chat.test.ts`        | ⬜  | ⬜      |
| TC-API-343-05 | History order                 | Medium   | Two messages sent             | GET chat                                        | Oldest first, user message before its answer, `used`/`limit` shown                | `routes/design-chat.test.ts`        | ⬜  | ⬜      |
| TC-API-343-06 | Another user's data           | High     | Two users                     | User B calls chat, list and apply on A's design | 404 each; pgTAP: B and admin read no rows                                         | `routes/design-chat.test.ts`, pgTAP | ⬜  | ⬜      |
| TC-API-343-07 | Apply twice                   | Medium   | An applied proposal           | POST apply again                                | 200 with the same version id                                                      | `routes/design-chat.test.ts`        | ⬜  | ⬜      |
| TC-API-343-08 | One real chat call on staging | Medium   | After #347, real provider set | Send "make the sleeve longer" on a blouse       | A valid proposal in Arabic and English; `ai_usage` row of kind `chat`             | manual only                         | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
