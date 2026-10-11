# Test cases — Data access spike (Drizzle vs supabase-js)

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #23                        |
| SRS          | NFR-04                     |
| Area         | infra                      |
| Last updated | 2026-10-11 (by PR for #23) |

## Test data

No seeded records. The prototype creates its own users through the Supabase admin API on local Supabase. The prototype lives on the unpushed branch `spike/23-drizzle-vs-supabase-js`; these cases become the adapter tests of the first repository in #24.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                               | Priority | Preconditions           | Steps                                         | Expected result                          | Automated by                    | dev | staging |
| -------------- | ----------------------------------- | -------- | ----------------------- | --------------------------------------------- | ---------------------------------------- | ------------------------------- | --- | ------- |
| TC-INFRA-23-01 | Own rows (both approaches)          | High     | Local Supabase, user A  | A creates a client, A lists                   | The client is listed with `owner_id` = A | spike `test/rls-suite.ts`       | ✅  | ⬜      |
| TC-INFRA-23-02 | Other user's rows hidden            | High     | Rows of A exist, user B | B lists                                       | Empty list                               | spike `test/rls-suite.ts`       | ✅  | ⬜      |
| TC-INFRA-23-03 | Owner comes from the token          | High     | User B                  | B creates a client                            | Owned by B, invisible to A               | spike `test/rls-suite.ts`       | ✅  | ⬜      |
| TC-INFRA-23-04 | Invalid token rejected              | High     | None                    | List with `jwt = "not-a-jwt"`                 | Error, no rows                           | spike `test/rls-suite.ts`       | ✅  | ⬜      |
| TC-INFRA-23-05 | Credit + client atomic, success     | High     | A has 1 credit          | Create client spending a credit               | Balance 0, client exists                 | spike `test/rls-suite.ts`       | ✅  | ⬜      |
| TC-INFRA-23-06 | Credit + client atomic, rollback    | High     | A has 0 credits         | Create client spending a credit               | Error, no client left, balance still 0   | spike `test/rls-suite.ts`       | ✅  | ⬜      |
| TC-INFRA-23-07 | Guard: no raw client export         | High     | None                    | Read the exports of the Drizzle modules       | Only factory functions, no raw db        | spike `test/guard.test.ts`      | ✅  | ⬜      |
| TC-INFRA-23-08 | Guard: raw connection reads nothing | High     | A row exists            | Query as the API role without `withUser`      | `permission denied`                      | spike `test/guard.test.ts`      | ✅  | ⬜      |
| TC-INFRA-23-09 | Pooler with `prepare: false`        | Medium   | Local pooler enabled    | Run the Drizzle suite through port 54329      | All pass; `prepare: true` hangs          | manual only                     | ✅  | ⬜      |
| TC-INFRA-23-10 | Bundle size under 300 kB            | Medium   | esbuild                 | `pnpm --filter spike bundle` on the prototype | Drizzle path 136.9 kB raw                | spike `scripts/bundle-size.mjs` | ✅  | ⬜      |

## Manual run log

| Date       | Env | Tester | Result | Notes                                             |
| ---------- | --- | ------ | ------ | ------------------------------------------------- |
| 2026-10-11 | dev | Claude | pass   | Supabase CLI 2.120, Supavisor 2.9.13, 15/15 tests |
