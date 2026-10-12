# Test cases — CI e2e and db-reset

| Field        | Value                   |
| ------------ | ----------------------- |
| Issue        | #111                    |
| SRS          | None (CI fix)           |
| Area         | infra                   |
| Last updated | 2026-10-12 (by PR #111) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID              | Title                   | Priority | Preconditions   | Steps           | Expected result                   | Automated by       | dev | staging |
| --------------- | ----------------------- | -------- | --------------- | --------------- | --------------------------------- | ------------------ | --- | ------- |
| TC-INFRA-111-01 | Web e2e spec loads      | High     | Local stack up  | `pnpm test:e2e` | auth.spec.ts loads, no JSON error | `e2e/auth.spec.ts` | ⬜  | ⬜      |
| TC-INFRA-111-02 | pgTAP runs all 31 tests | High     | `pnpm db:reset` | `pnpm db:test`  | 31/31 pass, no permission denied  | `rls.test.sql`     | ⬜  | ⬜      |
