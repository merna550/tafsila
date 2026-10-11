# Test cases — Fewer Actions minutes

| Field        | Value               |
| ------------ | ------------------- |
| Issue        | #86                 |
| SRS          | none (CI)           |
| Area         | infra               |
| Last updated | 2026-10-11 (by #86) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                                | Priority | Preconditions             | Steps                                                       | Expected result                                                  | Automated by                     | dev | staging |
| -------------- | ------------------------------------ | -------- | ------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------- | --- | ------- |
| TC-INFRA-86-01 | Docs-only PR skips Storybook, Docker | High     | Actions minutes available | Open a PR that changes only `docs/`                         | `storybook`, `lint`, `build` jobs are skipped and show as passed | `scripts/ci-paths.test.mjs`      | ⬜  | ⬜      |
| TC-INFRA-86-02 | `packages/ui` PR runs both           | High     | same                      | Open a PR that changes `packages/ui/src/*.tsx`              | Storybook and Docker jobs run                                    | `scripts/ci-paths.test.mjs`      | ⬜  | ⬜      |
| TC-INFRA-86-03 | Superseded PR run is cancelled       | Medium   | same                      | Push twice quickly to a PR                                  | The first Code quality and Docker runs show "cancelled"          | `scripts/workflows.test.mjs`     | ⬜  | ⬜      |
| TC-INFRA-86-04 | Dispatcher needs `agent:auto`        | High     | A `status:ready` issue    | Run Dispatch agent with dry_run, with and without the label | Without: "none has the label agent:auto"; with: it is picked     | `scripts/dispatch.test.mjs`      | ⬜  | ⬜      |
| TC-INFRA-86-05 | Usage report                         | Medium   | Token that reads Actions  | `node scripts/actions-usage.mjs --days 30`                  | Table of workflow, runs, minutes                                 | `scripts/actions-usage.test.mjs` | ✅  | ⬜      |
