# ADR-340 · 2026-11-02 · Design analysis job and its cost controls

**Context:** Issue #340 (M6, ADR-012, ADR-335 items 3, 4, 6) analyses a design's photos in the background and must keep AI cost and abuse in check.

**Decision:**

1. **`JOB_QUEUE=inline` is the default.** The job runs inside the request in local, CI and fake-provider setups; Inngest (`JOB_QUEUE=inngest`) is used in staging and production, where both Inngest keys are required.
2. **Analysis state lives in `designs.analysis`** (`none|pending|done|failed`). A `pending` state older than 5 minutes is dead: a new analysis may start and the poll reports `failed`.
3. **Caps:** 10 analyses per UTC day per user (`AI_ANALYZE_DAILY_LIMIT`) and 5 analysis requests per minute per user (`AI_RATE_LIMIT_PER_MINUTE`), an in-memory token bucket per server instance (a guard against loops, not a quota).
4. **The job strips image metadata itself** (JPEG APP1/APP13, PNG `eXIf` and text chunks, WebP `EXIF`/`XMP `) and sends bytes, not URLs, to the provider.
5. **Failed provider calls are logged in `ai_usage` too**, with the tokens used (`AiOutputInvalidError` now carries its usage) or zero tokens. A failure before the provider is called (download, bad image) logs nothing.
6. **Unsupported features are recorded by one new private function** `private.record_unsupported_features`, de-duplicated per design and text; a failure to record never fails the analysis.
7. **Failures store a safe code** (`AI_OUTPUT_INVALID`, `AI_ANALYSIS_FAILED`); provider text goes to the error reporter only.

**Reason:** None is costly to reverse. The in-memory rate limit is per instance; revisit with a shared store if abuse shows up.

**Alternatives:** Inngest only (needs an account in CI); a database rate limit (a table and function for a guard that the daily cap already backs).
