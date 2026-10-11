# Test cases — Rules v2, enforcement and error contract

| Field        | Value                  |
| ------------ | ---------------------- |
| Issue        | #66 (PR 1 of 3)        |
| SRS          | NFR-14                 |
| Area         | ui, api                |
| Last updated | 2026-10-09 (by PR #66) |

## Test data

None. Violations are written to temporary files by the automated tests.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                          | Priority | Preconditions    | Steps                | Expected result                                             | Automated by                                        | dev | staging |
| ------------ | ---------------------------------------------- | -------- | ---------------- | -------------------- | ----------------------------------------------------------- | --------------------------------------------------- | --- | ------- |
| TC-UI-66-01  | Component importing the API client fails       | High     | Repo checked out | Run `pnpm test:docs` | dependency-cruiser reports `ui-layer-is-presentational`     | `scripts/architecture-rules.test.mjs`               | ⬜  | ⬜      |
| TC-UI-66-02  | Model importing React fails                    | High     | Repo checked out | Run `pnpm test:docs` | `domain-layer-is-pure` is reported                          | `scripts/architecture-rules.test.mjs`               | ⬜  | ⬜      |
| TC-UI-66-03  | Supabase outside shared/auth fails             | High     | Repo checked out | Run `pnpm test:docs` | `supabase-only-in-auth` is reported                         | `scripts/architecture-rules.test.mjs`               | ⬜  | ⬜      |
| TC-UI-66-04  | Raw colour, arbitrary value, `ml-*` fail lint  | High     | Repo checked out | Run `pnpm test:docs` | ESLint reports `no-restricted-syntax`                       | `scripts/architecture-rules.test.mjs`               | ⬜  | ⬜      |
| TC-UI-66-05  | Literal JSX text and `fetch` fail lint         | High     | Repo checked out | Run `pnpm test:docs` | ESLint reports the text and fetch rules                     | `scripts/architecture-rules.test.mjs`               | ⬜  | ⬜      |
| TC-UI-66-06  | Raw colour in CSS fails                        | Medium   | Repo checked out | Run `pnpm test:docs` | `tokens:check` lists file and line                          | `scripts/check-design-tokens.test.mjs`              | ⬜  | ⬜      |
| TC-API-66-07 | Missing catalogue code or Arabic message fails | High     | Repo checked out | Run `pnpm test`      | `errors.test.ts` names the code                             | `packages/api/src/domain/errors.test.ts`            | ⬜  | ⬜      |
| TC-API-66-08 | Validation error carries field messages        | High     | Repo checked out | Run `pnpm test`      | Body has `details.fields` and `request_id`                  | `packages/api/src/middleware/error-handler.test.ts` | ⬜  | ⬜      |
| TC-UI-66-09  | Every failure type becomes an ApiError         | High     | Repo checked out | Run `pnpm test`      | 4xx, 5xx, offline, timeout, bad body map to the right place | `apps/web/src/shared/api/client.test.ts`            | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
