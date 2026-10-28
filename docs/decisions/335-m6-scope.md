# ADR-335 · 2026-10-28 · M6 scope: provider-neutral AI package, fake provider until the evaluation, caps from the first call

**Context:** M6 (AI layer) adds photo analysis, the confirmation screen and chat edits (SRS §12). The brief is `docs/milestones/M6-ai-layer.md`, issues #335-#348. ADR-002 already fixes that the AI only fills or edits a `DesignSpec` and the engine draws; SRS §9 lists the AI rules; ADR-012 chose Inngest for jobs; ADR-021 made `AI_*` optional until their milestone; the provider is open question 3 (SRS §13). These points were not written down: how the work proceeds without a paid key, where the evaluation photos live, where analysis and chat run, the caps, the confirmation rule, and how compare works. All are cheap to change before the beta (ADR-026), except spending, which ADR-022 reserves to Merna.

**Decision:**

1. **`packages/ai` on the Vercel AI SDK** (SRS §3.1). `analyzeDesign` and `proposeEdit` are the only entry points; provider and models come from `packages/config/env.ts` (`AI_PROVIDER`, `AI_ANALYZE_MODEL`, `AI_CHAT_MODEL`, the key). A **fake provider** answers from fixtures; CI, local dev and every build issue use it, so only #347 needs a real key.
2. **Evaluation photos stay out of the repo** (image rights, NFR-05): a private bucket `ai-eval` on staging or a private folder Merna shares. Labels (`labels.json`) are in the repo and validated against `designSpecSchema`.
3. **Analysis runs in an Inngest job** (`design.analyze`, ADR-012) behind the `JobQueue` port, on the Inngest free tier; the page polls the result. **Chat runs in the request** (one short call, well under the Vercel Hobby function limit).
4. **Caps from the first call** (SRS §9, NFR-04): 10 analyses a day per user and 10 chat messages per pattern (FR-CHAT-06), both from config; rate limits on both routes; one `ai_usage` row per call; never call AI for measurement-only regeneration. No charging in M6; credits come in M7.
5. **Confirmation:** the screen reuses the design picker cards and catalogue; any feature below 0.6 confidence must be confirmed before continuing (FR-DES-04). The confirmed spec takes the same path as the manual picker.
6. **Privacy:** photos in the private bucket `design-photos` with signed URLs; resized to ≤ 1600 px and EXIF stripped in the browser, re-checked in the job; deleted with the design and the account; only providers that do not train on API data.
7. **Compare** (FR-CHAT-05) is a browser overlay of two versions regenerated in the preview worker; no API change.
8. **FR-REC-04** is built last and cut first (priority C): text only from the rules' output.
9. **The provider choice is #347's,** with numbers from the harness (#338): accuracy per feature, p95 latency, EGP per pattern, privacy terms. It closes SRS open question 3.

**Open (`needs:decision` on #347):** real calls to Claude or Gemini need an API key with a payment method, which ADR-022 forbids without Merna's approval. The question on #347 asks her for a capped budget for the evaluation and staging.

**Reason:** The fake provider lets 13 of 14 issues proceed without spending; caps and logging from the start keep costs visible; a job keeps the 30 s analysis inside the free hosting limits.

**Alternatives:**

- Pick a provider now (no numbers; SRS says after the evaluation).
- Analysis inside the request (risks the Hobby function limit, no retry).
- Photos in the repo (image rights and size).
- Gemini's free tier for user photos (free-tier data may be used for training, against NFR-05).
