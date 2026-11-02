# ADR-346 · 2026-11-02 · AI explanation of the fabric recommendations

**Context:** Issue #346 (M6, FR-REC-04, ADR-335 item 8) adds an optional short text that says why the recommended fabrics suit the design. It must come from the rules' output only, not from free invention.

**Decision:**

1. **Cache per version, language and recommendation.** `fabric_explanations` is keyed by `(pattern_version_id, locale, catalogue_hash)`; the hash covers the recommended and avoided fabric ids and both reasons, so an admin edit (#320) that changes the result writes a new text. A cache hit calls no AI, logs nothing and does not count in the cap.
2. **The post-check on fabric names is the guard against invented content.** The text may name only fabrics of the recommendation (recommended or avoided). Names are matched in Arabic and English, with Arabic letter variants unified and one attached prefix allowed; a longer allowed name hides the shorter one inside it. A text with an outside fabric, over 70 words, over 1000 characters or empty is retried once with the problem, then `AiOutputInvalidError`.
3. **The cheaper chat model and a cap of 20 new explanations per UTC day** (`AI_EXPLAIN_DAILY_LIMIT`, counted from `ai_usage` rows of kind `explain`; 429 `EXPLAIN_DAILY_LIMIT`). Failed calls are logged too and cache nothing (502 `AI_EXPLAIN_FAILED`).
4. **The panel without `explain=true` stays AI-free.** The plain recommendation is unchanged and is not rate limited; only `explain=true` uses the AI rate limit (`AI_RATE_LIMIT_PER_MINUTE`, shared middleware from #340).
5. **Owner-only storage, no admin read**, like chat: the text is derived from a user's design.

**Reason:** None is costly to reverse; each keeps the AI on the writing side only and bounds cost.

**Alternatives:** Cache by version only (an admin rule edit would leave a stale text); trust the prompt without a check (the model could name a fabric the rules did not choose).
