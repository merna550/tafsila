# Test cases - Design analysis job

| Field        | Value                                   |
| ------------ | --------------------------------------- |
| Issue        | #340                                    |
| SRS          | FR-DES-02, FR-DES-03, FR-DES-07, NFR-04 |
| Area         | api                                     |
| Last updated | 2026-11-02 (by PR #340)                 |

## Test data

A design of the signed-in user with a front photo (see [design photos tutorial](../../backend/tutorials/design-photos.md)); `AI_PROVIDER=fake`, `JOB_QUEUE=inline`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                     | Priority | Preconditions                               | Steps                                                 | Expected result                                                    | Automated by                                                      | dev | staging |
| ------------- | ----------------------------------------- | -------- | ------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- | --- | ------- |
| TC-API-340-01 | Analyse with the fake provider            | High     | Design with front photo                     | POST `/api/designs/:id/analyze`, then GET `/analysis` | 202 pending, then `done` with a result; one `ai_usage` row         | `routes/design-analysis.test.ts`, Newman journey                  | ⬜  | ⬜      |
| TC-API-340-02 | Poll states                               | High     | Deferred jobs                               | GET before, during and after                          | `none`, `pending`, `done`; pending older than 5 min reads `failed` | `services/design-analysis.test.ts`                                | ⬜  | ⬜      |
| TC-API-340-03 | Daily cap and rate limit                  | High     | Cap 1 or limit 2                            | Repeat POST                                           | 429 `AI_DAILY_LIMIT` / `RATE_LIMITED`; another user unaffected     | `routes/design-analysis.test.ts`, `middleware/rate-limit.test.ts` | ⬜  | ⬜      |
| TC-API-340-04 | Unsupported category                      | High     | Design with front photo                     | POST with `categoryHint: "abaya"`                     | 422 `CATEGORY_NOT_SUPPORTED`, nothing queued                       | `routes/design-analysis.test.ts`                                  | ⬜  | ⬜      |
| TC-API-340-05 | Another user's design                     | High     | Two users                                   | POST and GET as the other user                        | 404                                                                | `routes/design-analysis.test.ts`                                  | ⬜  | ⬜      |
| TC-API-340-06 | With the Inngest dev server               | Medium   | `docker compose up -d`, `JOB_QUEUE=inngest` | Analyse a design                                      | Run appears at http://localhost:8288 and ends `done`               | manual only                                                       | ⬜  | ⬜      |
| TC-API-340-07 | Staging with a real provider (after #347) | Medium   | Staging keys                                | Analyse a real photo                                  | `done`, no GPS data reached the provider                           | manual only                                                       | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
