# Test cases — OpenAPI, Postman and Newman

| Field        | Value               |
| ------------ | ------------------- |
| Issue        | #94                 |
| SRS          | §8 API surface      |
| Area         | API                 |
| Last updated | 2026-10-11 (by #94) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                  | Priority | Preconditions          | Steps                                                             | Expected result                                                                  | Automated by                                              | dev | staging |
| ------------ | -------------------------------------- | -------- | ---------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------- | --- | ------- |
| TC-API-94-01 | OpenAPI document is complete           | High     | Dependencies installed | `pnpm api:openapi`                                                | `packages/api/openapi.json` has health, me, debug, bearer auth and error schemas | `packages/api/src/openapi/document.test.ts`               | ⬜  | ⬜      |
| TC-API-94-02 | Postman generation is stable           | High     | same                   | `pnpm api:postman` twice, then `git status`                       | No change after the second run                                                   | `scripts/api-test.test.mjs` (api:check)                   | ⬜  | ⬜      |
| TC-API-94-03 | Newman passes with no Docker           | High     | same                   | `pnpm api:test`                                                   | All assertions pass, exit code 0                                                 | `scripts/api-test.test.mjs`                               | ⬜  | ⬜      |
| TC-API-94-04 | A broken route fails Newman            | High     | same                   | `pnpm api:test --break=health`                                    | Run fails, exit code 1                                                           | `scripts/api-test.test.mjs`                               | ⬜  | ⬜      |
| TC-API-94-05 | Stale files fail the check             | High     | same                   | Change a route schema, run `pnpm api:check`                       | Exit 1, message names `pnpm api:openapi && pnpm api:postman`                     | `scripts/api-test.test.mjs`                               | ⬜  | ⬜      |
| TC-API-94-06 | CI runs the API steps only when needed | Medium   | Actions available      | Open a docs-only PR, then a PR touching `packages/api/src/routes` | First skips both steps, second runs them                                         | `scripts/ci-paths.test.mjs`, `scripts/workflows.test.mjs` | ⬜  | ⬜      |
| TC-API-94-07 | Document and viewer URLs               | Medium   | `pnpm dev:all`         | Open `/api/openapi.json` and `/api/docs`; build for production    | Both open locally; `/api/docs` is 404 in production                              | `packages/api/src/openapi/document.test.ts`               | ⬜  | ⬜      |
| TC-API-94-08 | Postman app run                        | Low      | Local Supabase, app    | Import collection and local environment, press Run                | Login works, health and me pass, `ERR` cases pass                                | Manual                                                    | ⬜  | ⬜      |
