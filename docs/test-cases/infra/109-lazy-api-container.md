# Test cases — Lazy API container

| Field        | Value                   |
| ------------ | ----------------------- |
| Issue        | #109                    |
| SRS          | NFR (deployment)        |
| Area         | infra / api             |
| Last updated | 2026-10-12 (by PR #109) |

## Test data

Environment variables only; no seeded records needed.

| Name        | Value                                                        |
| ----------- | ------------------------------------------------------------ |
| Placeholder | `SUPABASE_URL`, `SENTRY_DSN`, `DATABASE_URL` = `[SENSITIVE]` |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID              | Title                                | Priority | Preconditions              | Steps                                        | Expected result                            | Automated by                                      | dev | staging |
| --------------- | ------------------------------------ | -------- | -------------------------- | -------------------------------------------- | ------------------------------------------ | ------------------------------------------------- | --- | ------- |
| TC-INFRA-109-01 | Build with placeholder values        | High     | Placeholders set           | 1. Import the route module (or `next build`) | No error; `dynamic` is `force-dynamic`     | `apps/web/src/app/api/[[...route]]/route.test.ts` | ⬜  | ⬜      |
| TC-INFRA-109-02 | Protected route with invalid URL     | High     | `SUPABASE_URL=[SENSITIVE]` | 1. Call `/api/me` with any bearer token      | 500 `INTERNAL_ERROR` standard body         | `packages/api/src/lazy-app.test.ts`               | ⬜  | ⬜      |
| TC-INFRA-109-03 | Staging deploy with Sensitive values | High     | Variables marked Sensitive | 1. Run the Staging workflow                  | `vercel build` passes; `/api/health` is ok | manual only                                       | ⬜  | ⬜      |
| TC-INFRA-109-04 | App built once, reused               | Medium   | -                          | 1. Send two requests                         | Factory runs once                          | `packages/api/src/lazy-app.test.ts`               | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
