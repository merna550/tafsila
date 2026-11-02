# Tutorial: chat edits (issue #343)

A user asks for a change in words; the server answers with a checked proposal; the user applies it as a new version. The model never writes a version (ADR-002, [decision 343](../../decisions/343-chat-edits-api.md)).

## The three routes

| Route                                     | What it does                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/designs/:id/chat`              | `{ message (1 to 500 chars), versionId }`. Checks the design and version (404), the per-design quota (429 `CHAT_QUOTA_EXCEEDED`), the daily cap (429 `CHAT_DAILY_LIMIT`) and the rate limit (429 `RATE_LIMITED`). Calls `proposeEdit` with the last 6 turns, stores the user message and the answer, logs `ai_usage` (kind `chat`, also on failure) and returns `{ messageId, outcome, changes[], unsupported?, used, limit }`. |
| `GET /api/designs/:id/chat`               | The history, oldest first, with `used` and `limit`.                                                                                                                                                                                                                                                                                                                                                                             |
| `POST /api/designs/:id/chat/:msgId/apply` | Re-checks the stored patch on its base version, saves a version through the save path with `created_by = chat`, and stores `applied_version_id`. 201 the first time, 200 (same version) after.                                                                                                                                                                                                                                  |

## How an answer is built

1. `proposeEdit` (`packages/ai`) returns a `SpecPatch` and the engine's verdict (`applySpecPatch`).
2. `buildChatAnswer` (`services/chat-shared.ts`): a patch the engine accepts that changes something is a `proposal`; anything else is `unsupported` with the model's explanation and the closest supported changes.
3. `describeChanges` (`domain/describe-changes.ts`) writes one line per change in both languages ("Sleeve length: short → long" / "طول الكم: قصير ← طويل"), lengths in cm.

## Try it locally

Use the memory app (`pnpm api:test`) or `pnpm dev:all` with `AI_PROVIDER=fake`. The fake provider answers by keyword: "pocket", "longer", "jumpsuit". Real calls wait for the provider eval (#347).

## Settings

`CHAT_MESSAGES_PER_DESIGN` (default 10), `AI_CHAT_DAILY_LIMIT` (default 100), `AI_RATE_LIMIT_PER_MINUTE` (shared with analysis, default 5). Read in `packages/config/src/jobs.ts`.

## Privacy

`chat_messages` is owner-only: admins have no read policy (pgTAP `chat-messages.test.sql`).
