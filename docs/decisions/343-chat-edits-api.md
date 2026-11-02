# ADR-343 · 2026-11-02 · Chat edits API

**Context:** Issue #343 (M6, ADR-335 items 3, 4, ADR-002) lets a user ask for a change in words and apply it as a new version.

**Decision:**

1. **A proposal is tied to its base version.** Applying after the design moved is a 409 `CHAT_PROPOSAL_STALE`, never a silent rebase; the user asks again on the current version.
2. **The quota counts every user message**, including unsupported answers (`CHAT_MESSAGES_PER_DESIGN`, default 10, FR-CHAT-06). A message whose provider call failed is not stored, so it uses no quota; the call is still logged in `ai_usage`.
3. **Admins cannot read chat content.** `chat_messages` has an owner policy only (no admin policy); counts can come later through a function.
4. **The model never writes a version.** Apply re-checks the stored patch with `applySpecPatch` on the base version, saves through the existing save path (`created_by = chat`), and the engine refuses a `fail` report (422, nothing saved).
5. **History sent to the model is the last 6 turns**, to bound cost.
6. **Caps:** daily cap `AI_CHAT_DAILY_LIMIT` (default 100 per UTC day, counted from `ai_usage` rows of kind `chat`) and the same per-minute rate limit as analysis (`AI_RATE_LIMIT_PER_MINUTE`, shared middleware from #340).
7. **Applying twice returns the same version** (200); the first apply is 201.

**Reason:** None is costly to reverse; each keeps the AI on the proposing side only and bounds cost.

**Alternatives:** Rebase a stale proposal onto the newest version (surprising for the user); let admins read chat for support (privacy, ADR-32a item 4).
