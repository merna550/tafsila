# Test cases — Staging environment

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #19                        |
| SRS          | NFR-13                     |
| Area         | infra                      |
| Last updated | 2026-10-08 (by PR for #19) |

## Test data

No seeded records are needed. Test phone numbers: `201000000001` to `201000000003`, code `123456`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                | Priority | Preconditions                     | Steps                                                                  | Expected result                                          | Automated by                    | dev | staging |
| ------------ | ------------------------------------ | -------- | --------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------- | --- | ------- |
| TC-INF-19-01 | PR preview URL works                 | High     | Open PR, Vercel integration on    | 1. Open the Vercel comment on the PR. 2. Open `/api/health`            | `status: ok`, `environment: preview`                     | manual only                     | ⬜  | ⬜      |
| TC-INF-19-02 | Staging health shows environment+SHA | High     | A merge to `main` finished        | 1. Open `$STAGING_URL/api/health`                                      | `environment: staging`, `gitSha` equals the merge commit | `scripts/smoke-health.test.mjs` | ⬜  | ⬜      |
| TC-INF-19-03 | Migration applied by CI              | High     | A PR added a migration and merged | 1. Open Supabase dashboard, Database, Migrations                       | The new migration is listed; no seed rows were added     | manual only                     | ⬜  | ⬜      |
| TC-INF-19-04 | Test OTP sign-in on staging          | Medium   | Staging deployed                  | 1. Sign in with `201000000001`. 2. Enter `123456`                      | Signed in, no SMS sent                                   | manual only                     | ⬜  | ⬜      |
| TC-INF-19-05 | Paused project recovery              | Low      | Free project paused               | 1. Re-run Staging workflow (fails). 2. Restore in dashboard. 3. Re-run | Second run is green                                      | manual only                     | ⬜  | ⬜      |
| TC-INF-19-06 | Workflow order and no secret in logs | High     | Workflow run finished             | 1. Open the run. 2. Search the logs for secret names' values           | Order migrate, deploy, smoke; no secret values           | `scripts/workflows.test.mjs`    | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
