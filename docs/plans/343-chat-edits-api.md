## Plan #343: Chat edits API, propose, validate and apply spec patches

plan:opus · build:sonnet (kept: the plan fixes the contract; the build is routine) · size M (unchanged) · M6 wave 2 · FR-CHAT-01..04, FR-CHAT-06, NFR-04 · ADR-335 items 3, 4 · merged: `proposeEdit` and `applySpecPatch` (#337), `AiUsageRepository` (#339), the save-version service (#245)

### Approach

Use the `add-endpoint` skill. The model never writes a version: it proposes a patch, the server validates it, the user confirms, and the existing save-version service creates the version (ADR-002).

**Migration `supabase/migrations/<ts>_chat_messages.sql`:** `chat_messages` (SRS §7: `id uuid`, `design_id` references `designs` on delete cascade, `owner_id`, `role` `user|assistant`, `content text`, `base_version_id uuid` (the version the proposal was made against), `proposed_patch jsonb`, `changes jsonb` (the bilingual summary lines), `outcome` `proposal|unsupported|none`, `applied_version_id uuid null`, `created_at`). Composite FK `(design_id, owner_id)` to `designs(id, owner_id)` as `pattern_versions` does. RLS: owner select/insert/update only through the API role path (insert and the `applied_version_id` update are done by `withUser`, owner-only policies like the other tables); admins can read counts but the policy exposes no content to admins (privacy, ADR-32a item 4: admins see counts only; policy for admins = none, a count function if the admin dashboard needs it later). pgTAP: cross-user denied, cascade on design delete.

**Routes:**

- `POST /api/designs/:id/chat` (`{ message (1 to 500 chars), versionId }`): checks ownership (404), that `versionId` belongs to the design, the **quota** (count of the design's user messages, default 10 from config `CHAT_MESSAGES_PER_DESIGN`, 429 `CHAT_QUOTA_EXCEEDED` with `{ used, limit }`), the daily cap (`AI_CHAT_DAILY_LIMIT` default 100) and the rate limit (reuses `middleware/rate-limit.ts` from #340; if #340 is not merged first, the build extracts the middleware there and #340 rebases onto it). It loads the version's `spec`, calls `proposeEdit({ spec, message, history: last 6 turns })`, records the user message and the assistant message with the patch, writes an `ai_usage` row (`kind: "chat"`, also on failure), and returns `{ messageId, outcome, changes[], unsupported?: { text, closest[] }, used, limit }`. `changes` is one bilingual line per op built by a pure `describeChanges(patch, spec)` (for example "Sleeve length: short → long" / "طول الكم: قصير ← طويل"). An empty or invalid patch is answered as `unsupported` with the closest supported option (FR-CHAT-04); the quota still counts the message.
- `GET /api/designs/:id/chat`: the message history (newest last) with `used`/`limit`.
- `POST /api/designs/:id/chat/:msgId/apply`: loads the stored proposal; if its `base_version_id` is no longer the design's current version → 409 `CHAT_PROPOSAL_STALE` (the user asks again on the current version); re-validates the patch with `applySpecPatch` against the base version's spec; saves a version through the **existing save-version service** with the new spec and the base version's measurements/options and `created_by = "chat"` (the engine re-runs; a `fail` report → 422 `PATTERN_INVALID`, nothing saved); stores `applied_version_id`. Applying the same message twice returns the same version (200, idempotent).
- Error codes bilingual; OpenAPI, Postman (fake provider journey), tutorial, seed-data docs.

### Files

Create: `supabase/migrations/<ts>_chat_messages.sql`, `supabase/tests/database/chat-messages.test.sql`, `packages/schemas/src/chat.ts` (+ test), `packages/api/src/ports/chat-repository.ts` + Supabase and memory adapters, `services/{send-chat-message,list-chat-messages,apply-chat-edit}.ts`, `lib/describe-changes.ts`, `routes/design-chat.ts` (+ tests next to each), `docs/backend/tutorials/chat-edits.md`, `docs/decisions/343-chat-edits-api.md`, `docs/test-cases/api/343-chat-edits.md`.
Change: `container.ts`, config (`CHAT_MESSAGES_PER_DESIGN`, `AI_CHAT_DAILY_LIMIT`), `domain/errors.ts`, `docs/errors.md`, `docs/SRS.md` §7/§8, glossary, learning log; Drizzle schema if the repo mirrors tables.

### Test plan

- **Services (memory, fake AI):** "add side pockets" → outcome `proposal`, one change line in both languages; "make the sleeve longer" → `sleeve.length` change; "make it a jumpsuit" → `unsupported` with a closest option; apply → version n+1 with `created_by: "chat"`, `current_version_id` moved; apply twice → same version; apply after another save → 409 stale; the 11th message → 429 `CHAT_QUOTA_EXCEEDED`; a patch the engine refuses never saves a version (422).
- **`describeChanges`:** table tests for set, setLength (mm to cm), addPocket/removePocket, both languages, deterministic order.
- **Routes:** 401; another user's design 404; a `versionId` of another design 404; shapes against the schemas; OpenAPI test; `ai_usage` row per call including a failed one.
- **pgTAP:** owner insert/select; another user sees zero rows; no admin read of content; cascade on design delete; `applied_version_id` update only by the owner.
- **Postman/Newman journey** with the fake provider: save a version → chat → apply → list versions shows `chat`.
- No real provider, no network.

Manual test cases (draft): TC-API-343-01 supported edit applies; 02 unsupported request explained; 03 quota of 10; 04 stale proposal; 05 history order; 06 (after #347) one real chat call on staging.

### Decisions to log (`docs/decisions/343-chat-edits-api.md`)

1. A proposal is tied to its base version; applying after the design moved is a 409, not a silent rebase.
2. The quota counts every user message, including unsupported answers.
3. Admins cannot read chat content (counts only).
4. `build:sonnet` stays: the contract is fixed here and the code reuses `applySpecPatch` and save-version.
5. History sent to the model is the last 6 turns, to bound cost.

None is costly to reverse.

### Risks

- **Prompt injection through the message text:** the model can only return tool calls that become a validated `SpecPatch`; nothing the model writes is executed or stored as a spec without `applySpecPatch` and the engine's rules.
- **Shared rate-limit middleware** with #340: whichever merges first owns it.
- **Cost:** daily cap plus the per-design quota; both logged.

### Labels and needs

`plan:opus` (done), `build:sonnet` stays, size M. `needs-interactive` on the planned files: run below.

## Deviations

- `describeChanges` takes the engine's `SpecChange[]` (path, from, to) instead of `(patch, spec)`: `applySpecPatch` already reports exactly what changed, so the function stays pure and needs no spec. It lives in `packages/api/src/domain/describe-changes.ts` (pure code lives in `domain/`, there is no `lib/`). Changes that only fill an absent part with `none` are not shown.
- For an `unsupported` answer the `changes` column holds the closest supported changes (the summary of what the model offered instead); the explanation text is stored in `proposed_patch.unsupported`.
- Added `seq` (identity) to `chat_messages` to keep a message before its answer, and the codes `CHAT_DAILY_LIMIT`, `CHAT_NOTHING_TO_APPLY` and `AI_CHAT_FAILED` next to the planned `CHAT_QUOTA_EXCEEDED` and `CHAT_PROPOSAL_STALE`.
- The error body `details` gained `used` and `limit` for `CHAT_QUOTA_EXCEEDED`.
- The Postman journey is covered by the generated collection plus an `ERR` case; the chat journey itself runs in the memory-app route tests (see the test-case file).
