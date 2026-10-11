# Test cases — Fewer Actions minutes (part 2)

| Field        | Value               |
| ------------ | ------------------- |
| Issue        | #83                 |
| SRS          | none (CI)           |
| Area         | infra               |
| Last updated | 2026-10-11 (by #83) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                                 | Priority | Preconditions             | Steps                                                    | Expected result                                     | Automated by                 | dev | staging |
| -------------- | ------------------------------------- | -------- | ------------------------- | -------------------------------------------------------- | --------------------------------------------------- | ---------------------------- | --- | ------- |
| TC-INFRA-83-01 | Docs-only PR skips the database proof | High     | Actions minutes available | Open a PR that changes only `docs/`                      | `db-reset` is skipped and shows as passed           | `scripts/ci-paths.test.mjs`  | ⬜  | ⬜      |
| TC-INFRA-83-02 | A migration runs the database proof   | High     | same                      | Open a PR that changes `supabase/migrations/*.sql`       | `db-reset` runs                                     | `scripts/ci-paths.test.mjs`  | ⬜  | ⬜      |
| TC-INFRA-83-03 | Superseded runs are cancelled         | Medium   | same                      | Push twice quickly to a PR touching `supabase/`, `docs/` | First Supabase and Docs links runs show "cancelled" | `scripts/workflows.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-83-04 | Playwright browsers are cached        | Medium   | same                      | Re-run Storybook after one successful run                | The cache step reports a hit; no browser download   | `scripts/workflows.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-83-05 | Dispatcher cron is every 12 hours     | Low      | none                      | Run `pnpm test:docs`                                     | Test passes with `0 */12 * * *`                     | `scripts/workflows.test.mjs` | ⬜  | ⬜      |
