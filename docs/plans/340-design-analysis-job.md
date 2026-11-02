## Plan #340: Analyse a design in the background with cost controls

plan:sonnet · build:sonnet · size M (unchanged; two parts if the checkpoint rule asks, see Risks) · M6 wave 2 · FR-DES-02, FR-DES-03, FR-DES-07, NFR-02, NFR-04, SRS §8, §9 · ADR-012 (Inngest behind a `JobQueue` port), ADR-335 items 3, 4, 6 · merged: `@tafsila/ai` (#337), photos, `ai_usage`, `unsupported_features` (#339: `PhotoStorage`, `AiUsageRepository`)

### Approach

Use the `add-endpoint` skill. Inngest is documented in the handbook but **not wired in code yet**, so this issue adds the port, the adapters and the serve route.

**Job infrastructure:**

- `ports/job-queue.ts`: `JobQueue.enqueue(name, payload)`. Adapters: `adapters/inngest/inngest-job-queue.ts` (sends the event with the Inngest client), `adapters/memory/inline-job-queue.ts` (runs the registered handler **inline**, deterministic, used by tests, local dev and CI with the fake provider).
- `jobs/` folder (as in the architecture doc): `design-analyze.ts` defines the Inngest function `design.analyze` (retries 1, concurrency 1 per design) that calls the same service the inline queue calls.
- `routes/inngest.ts`: Hono mount of the Inngest `serve` handler at `/api/inngest` (signing key checked by the SDK). Config in `packages/config/env.ts`: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` (optional; required when `APP_ENV` is staging/production and `AI_PROVIDER` is not `fake`), `JOB_QUEUE` = `inline|inngest` (default `inline`). Free tier only (ADR-022); the Inngest account and keys are Merna's, documented in a tutorial, not needed for CI.
- Pin the `inngest` package version exactly; handbook card (`docs:check`).

**Service and routes:**

- `POST /api/designs/:id/analyze` (`{ categoryHint? }`, 202): checks the design is the user's (404 otherwise), the front photo exists (422 `PHOTO_FRONT_REQUIRED`), the category hint is supported (`dress|skirt|blouse`; anything else 422 `CATEGORY_NOT_SUPPORTED`, the "coming soon" case, FR-DES-02), no analysis is already running (409 `ANALYSIS_IN_PROGRESS`; a `pending` older than 5 minutes counts as dead), the daily cap (`AI_ANALYZE_DAILY_LIMIT`, default 10, from `AiUsageRepository.countToday`, 429 `AI_DAILY_LIMIT`), and the route rate limit (a small in-memory token bucket middleware, `AI_RATE_LIMIT_PER_MINUTE` default 5 per user, 429 `RATE_LIMITED`, NFR-04; it lives in `middleware/rate-limit.ts` and the phone routes' existing limiter is reused if it is generic, else extracted so there is one copy). It writes `designs.analysis = { status: "pending", startedAt }` and enqueues.
- `GET /api/designs/:id/analysis`: `{ status: "none" | "pending" | "done" | "failed", result?, error? }`.
- Job body (`services/run-design-analysis.ts`): reads the photos with `PhotoStorage.signedReadUrls`, **downloads the bytes and strips EXIF** with a pure `stripJpegExif(bytes)` (drops APP1/Exif segments; PNG/WebP chunks of type `eXIf`) so GPS never reaches the provider (the browser already strips; this is the second check, ADR-335 item 6), calls `analyzeDesign` with `{ photos, hint }`, stores `designs.analysis = { status: "done", result, finishedAt }`, writes one `ai_usage` row (`kind: "analyze"`) **also on failure** with the tokens used, and inserts `unsupported_features` rows (FR-DES-07, de-duplicated by text). On `AiOutputInvalidError` or a provider error the status becomes `failed` with a safe error code (no provider text).
- Never called for measurement-only regeneration (no code path from pattern routes).
- Error codes bilingual; OpenAPI, Postman (fake provider journey), seed-data docs, tutorial `docs/backend/tutorials/ai-analysis.md` (inline vs Inngest, local Inngest dev server, staging keys as env vars).

### Files

Create: `packages/api/src/ports/job-queue.ts`, `adapters/inngest/*`, `adapters/memory/inline-job-queue.ts`, `jobs/design-analyze.ts`, `routes/inngest.ts`, `routes/design-analysis.ts`, `middleware/rate-limit.ts`, `services/{start-design-analysis,get-design-analysis,run-design-analysis}.ts`, `lib/strip-image-metadata.ts` (+ tests next to each); `packages/schemas/src/design-analysis-api.ts` (status response, request body, error codes); a port `UnsupportedFeatureRepository` (insert many, uses #339's private function) with Supabase and memory adapters.
Change: `packages/config/src/env.ts` (+ test), `.env.example`, `container.ts`, `domain/errors.ts`, `docs/errors.md`, `docs/SRS.md` §8, `docs/backend/README.md`, `docs/decisions/340-design-analysis-job.md`, `docs/test-cases/api/340-design-analysis.md`, glossary, learning log; dependency cards for `inngest`.

### Test plan

- **Services (memory adapters, fake AI, inline queue):** analyse → status `pending` → `done` with a result; a second start while `pending` → 409; a `pending` older than 5 minutes is replaced; no front photo → 422; hint `abaya` → 422 `CATEGORY_NOT_SUPPORTED`; the 11th analysis in a UTC day → 429 `AI_DAILY_LIMIT` (clock port); `ai_usage` row recorded on success **and** on failure; unsupported texts stored once; provider error → `failed` with a safe code and no provider message.
- **`stripJpegExif`/PNG/WebP:** a JPEG fixture with a GPS EXIF block comes out with no APP1; image data identical; a clean JPEG is unchanged; garbage bytes are rejected, not crashed on.
- **Rate limit middleware:** the 6th request within a minute → 429; another user is unaffected; the bucket refills with a fake clock.
- **Routes:** 401 without token; another user's design → 404; response shapes validate against the Zod schemas; OpenAPI test; the `/api/inngest` route answers the SDK introspection call (smoke) and refuses an unsigned run in `inngest` mode.
- **Config:** `JOB_QUEUE=inngest` without keys fails in staging; `inline` works everywhere.
- **Postman/Newman** journey with the fake provider: create design → upload (#339 steps) → analyse → poll → done; ERR cases for 409, 422, 429.
- No network call and no real key anywhere.

Manual test cases (draft): TC-API-340-01 analyse with the fake provider; 02 poll states; 03 daily cap; 04 unsupported category; 05 with the Inngest dev server running locally; 06 (after #347) staging with a real provider.

### Decisions to log (`docs/decisions/340-design-analysis-job.md`)

1. `JOB_QUEUE=inline` is the default and runs the job inside the request path of the memory/local setups; Inngest is used in staging/production.
2. Analysis state lives in `designs.analysis` (`none|pending|done|failed`); a `pending` older than 5 minutes is dead.
3. Caps: 10 analyses per UTC day, 5 requests per minute per user, both config.
4. The job strips image metadata itself and sends bytes, not URLs, to the provider.
5. Failed calls are logged in `ai_usage` too (cost is real even when the answer is rejected).

None is costly to reverse.

### Risks

- **Size:** infrastructure plus feature; if the build nears the turn limit it checkpoints after the queue and config, then the routes (ADR-032).
- **Inngest SDK behaviour under Vercel Hobby** (function duration): the job calls the provider once with a 60 s timeout; the handbook card notes the free-tier limits.
- **Image bytes in memory:** at most 3 photos of ≤ 1600 px (≈ 1 MB each after the browser resize).

### Labels and needs

Size M, `plan:sonnet`, `build:sonnet` stay. `needs-interactive` on the planned files: run below.

## Deviations

- The metadata stripper lives in `domain/strip-image-metadata.ts` (pure, no I/O) instead of `lib/`.
- Added a `PhotoDownloader` port (the job needs bytes behind signed URLs) and `private.record_unsupported_features` (migration `20261102120000`, pgTAP `unsupported-features-batch.test.sql`) so de-duplication happens in the database.
- `@tafsila/ai` gained a `./testing` entry and `AiOutputInvalidError.usage` so failed calls can be costed.
- Config moved to `packages/config/src/jobs.ts` (file size rule); ESLint `import-x/no-cycle` now ignores external packages (it cannot parse `inngest`).
- The Postman journey has no 422 step (ERR steps run after the design is deleted); the 404 cases are in `err-cases.json`.
