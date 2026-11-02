# Plan #346: AI explanation of the fabric recommendations (FR-REC-04)

plan:sonnet · build:sonnet · size S (unchanged) · M6 wave 2 · FR-REC-04 (priority C), NFR-04, NFR-06 · ADR-335 item 8 · merged: `@tafsila/ai` (#337), recommendations API and panel (#317, #319), `AiUsageRepository` (#339) · Screen: `docs/design/screens/FabricExplain.dc.html` (+ images)

### Approach

Use the `add-endpoint` and `add-page` skills (small). Text only, built from the rules' output; the model may not add a claim or a fabric.

- **`explainRecommendations(input, deps)`** in `packages/ai/src/explain-recommendations.ts`: input is the `recommend` result (recommended fabrics with reasons, the avoid list with reasons), the design's spec summary and the language (`ar|en`); output is one short paragraph (at most 70 words) and `usage`. The prompt says: use only the given reasons and fabric names, add no fabric, no price, no care claim not in the input. A **post-check** rejects the text when it contains a fabric name (Arabic or English, from the whole catalogue) that is not in the input, then retries once with the error, then throws `AiOutputInvalidError`. Fake provider fixture answers deterministically. Chat-tier model (`AI_MODEL_CHAT`), temperature 0.
- **API:** `GET /api/fabrics/recommend?versionId=&explain=true&locale=ar|en` returns the existing body plus `explanation?: { text, locale }`. A new table `fabric_explanations` (`pattern_version_id`, `locale`, `catalogue_hash`, `text`, `created_at`, unique on the three keys; owner-only RLS through the version like `fabric_calcs`) caches the text; `catalogue_hash` is a hash of the recommended and avoid ids and reasons, so an admin edit (#320) invalidates it. Cache hit → no AI call. A miss checks the daily cap (`AI_EXPLAIN_DAILY_LIMIT` default 20, `countToday(…, "explain")`, 429 `AI_DAILY_LIMIT`), calls the AI, stores the text, writes `ai_usage` (`kind: "explain"`, also on failure). Without `explain=true` nothing changes (the panel of #319 keeps working with no AI).
- **UI:** in the recommendations panel (`features/fabric`), a "Why these fabrics?" button as in `FabricExplain.dc.html`; loading state, the paragraph with an "AI-written from the rules" note, error state with retry, hidden when the provider is `fake` is **not** done (the fake text is fine for dev). Messages `fabric.explain.*` ar/en; the request carries the UI locale.

### Files

Create: `packages/ai/src/explain-recommendations.ts` (+ test, fixture answer), `supabase/migrations/<ts>_fabric_explanations.sql`, `supabase/tests/database/fabric-explanations.test.sql`, `packages/api/src/ports/fabric-explanation-repository.ts` + adapters, `services/explain-fabric-recommendations.ts`, `apps/web/src/features/fabric/components/ExplainRecommendations.tsx`, `hooks/use-fabric-explanation.ts`, tests, `apps/web/e2e/fabric-explain.spec.ts`, `docs/test-cases/ui/346-fabric-explain.md`, `docs/decisions/346-fabric-explanation.md`, screenshots under `docs/test-cases/ui/screenshots/346/`.
Change: the recommend route and schemas (`explanation?`), `container.ts`, config, `domain/errors.ts`, `docs/errors.md`, OpenAPI, Postman, `docs/SRS.md` §7/§8, `docs/backend/ai.md`, `messages/{ar,en}.json`, `docs/frontend/README.md`, glossary, learning log.

### Test plan

- **Package (fake and test models):** a valid answer passes; an answer naming a fabric not in the input (Arabic or English name) is rejected and retried once, then throws; the prompt contains every input reason and no fabric outside the input; output over 70 words is rejected.
- **Service (memory):** first call → AI called once, text cached; second call same inputs → cache hit, no AI call, no `ai_usage` row; admin edit of a rule changes `catalogue_hash` → regenerated; 21st call in a UTC day → 429; failure recorded in `ai_usage`; another user's version → 404.
- **Route:** `explain` absent → body unchanged (existing tests stay green); shapes validate; OpenAPI test; pgTAP: owner-only read/insert, cascade on version delete.
- **Component:** button loads and shows the text; error state with retry; loading skeleton; both locales.
- **E2E (ar-desktop; en smoke) with the fake provider:** open a saved version, click "Why these fabrics?", see the paragraph; reload and see it again instantly (cache).
- **Screenshots:** ar/en, mobile and desktop.

Manual test cases (draft): TC-UI-346-01 explanation in Arabic; 02 English; 03 after an admin rule edit the text changes; 04 daily cap message; 05 (after #347) real provider check that no extra fabric is named.

### Decisions to log (`docs/decisions/346-fabric-explanation.md`)

1. Cache per version, locale and a hash of the recommendation, so admin edits invalidate it.
2. The post-check on fabric names is the guard against invented content (FR-REC-04 "not free invention").
3. Explanation uses the cheaper chat model; 20 calls per day cap.
4. The panel without `explain=true` stays AI-free.

None is costly to reverse.

### Risks

- **Fabric-name matching** in Arabic (variants such as ة/ه): the check normalises Arabic letters and compares by the catalogue's own names; a false negative only retries.
- **Priority C:** first to cut if M6 runs late.

### Labels and needs

Size S, `plan:sonnet`, `build:sonnet` stay. `needs-interactive` on the planned files: run below.

## Deviations

- Two new error codes instead of reusing `AI_DAILY_LIMIT`: `EXPLAIN_DAILY_LIMIT` (429, the existing message talks about photo analyses) and `AI_EXPLAIN_FAILED` (502, like `AI_CHAT_FAILED`). The route also returns `RATE_LIMITED`, applied only when `explain=true` (new `when` option of the shared `rateLimit` middleware).
- The request carries `locale` (default `ar`), and the AI usage helpers of the chat service moved to `services/ai-usage-shared.ts` so the explanation reuses them (no duplicate).
- `fabric_explanations` has no update or admin-read grant: a text is never edited, a changed catalogue state writes a new row.
- The text is also limited to 1000 characters (the table check), next to the 70-word limit.
