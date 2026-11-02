# Design analysis in the background (issue #340)

`POST /api/designs/:id/analyze` starts a job, `GET /api/designs/:id/analysis` polls it. The job reads the photos through short-lived signed URLs, strips image metadata, calls `analyzeDesign` (`@tafsila/ai`), stores `designs.analysis`, writes an `ai_usage` row and records unsupported features. Decisions: [ADR-340](../../decisions/340-design-analysis-job.md).

## Inline or Inngest

| `JOB_QUEUE`        | Runs                             | Use                          |
| ------------------ | -------------------------------- | ---------------------------- |
| `inline` (default) | Inside the request, same process | local, CI, the fake provider |
| `inngest`          | Inngest calls `/api/inngest`     | staging, production          |

## Local Inngest dev server

1. `docker compose up -d` starts the dev server at http://localhost:8288.
2. Set `JOB_QUEUE=inngest` in `.env.local` (no keys needed locally) and run `pnpm dev:all`.
3. Analyse a design; the run `design.analyze` shows in the dev server.

## Staging keys

Create a free Inngest account (Merna). Set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` as environment variables of the staging project (never in code), `JOB_QUEUE=inngest`, then sync the app URL `https://<staging>/api/inngest` in the Inngest dashboard. Config refuses `inngest` in staging or production without both keys. The free plan has 50,000 runs a month and pauses when used up.

## Cost controls

`AI_ANALYZE_DAILY_LIMIT` (default 10 per UTC day) and `AI_RATE_LIMIT_PER_MINUTE` (default 5 per user). A `pending` analysis older than 5 minutes counts as dead. Failed provider calls are logged in `ai_usage` too. Stored failure codes: `AI_OUTPUT_INVALID`, `AI_ANALYSIS_FAILED`.

## Tests

Use `createMemoryApp({}, { deferredJobs: true })`: `api.jobs.drain()` runs the held job, so a test can see `pending`. Script provider answers with `@tafsila/ai/testing`.
