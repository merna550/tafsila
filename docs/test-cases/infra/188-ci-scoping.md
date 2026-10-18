# Test cases - CI scoping

| Field        | Value                |
| ------------ | -------------------- |
| Issue        | #188                 |
| SRS          | none (CI)            |
| Area         | infra                |
| Last updated | 2026-10-18 (by #188) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID              | Title                           | Priority | Preconditions | Steps                                   | Expected result                                                              | Automated by                | dev | staging |
| --------------- | ------------------------------- | -------- | ------------- | --------------------------------------- | ---------------------------------------------------------------------------- | --------------------------- | --- | ------- |
| TC-INFRA-188-01 | Docs-only PR                    | High     | CI available  | Open a PR that changes only `docs/*.md` | Only docs:check (and prettier on its files, lychee) run; the rest is skipped | `scripts/ci-paths.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-188-02 | Engine-only PR                  | High     | same          | Change `packages/engine/src/*.ts`       | e2e, storybook, db-reset, tokens, docs, api skipped; docker, jscpd run       | `scripts/ci-paths.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-188-03 | UI PR                           | High     | same          | Change `packages/ui/src/*.tsx`          | storybook, tokens, e2e run                                                   | `scripts/ci-paths.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-188-04 | Lockfile change                 | High     | same          | Change `pnpm-lock.yaml`                 | everything runs                                                              | `scripts/ci-paths.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-188-05 | Required checks never disappear | High     | same          | Open a docs-only PR                     | quality, build, e2e, db-reset, storybook report success                      | `scripts/ci-paths.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-188-06 | Turbo cache and nightly run     | Medium   | same          | Re-run quality; see Actions schedule    | "cache hit" lines; a scheduled quality run at 03:00 UTC                      | manual                      | ⬜  | ⬜      |
