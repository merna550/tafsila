# Test cases — Docker snapshots and client error texts

| Field        | Value               |
| ------------ | ------------------- |
| Issue        | #99                 |
| SRS          | NFR-14, FR-UX-01    |
| Area         | ui                  |
| Last updated | 2026-10-11 (by #99) |

## Test data

None.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID          | Title                                          | Priority | Preconditions            | Steps                                                                   | Expected result                                                            | Automated by                                | dev | staging |
| ----------- | ---------------------------------------------- | -------- | ------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- | --- | ------- |
| TC-UI-99-01 | Docker image is pinned to the lockfile version | High     | Repo checked out         | Run `pnpm --filter @tafsila/ui test:visual:update:docker -- --dry-run`  | Printed image tag is `v<Playwright version in pnpm-lock.yaml>-noble`       | `scripts/ui-snapshots-docker.test.mjs`      | ⬜  | ⬜      |
| TC-UI-99-02 | Only the snapshot folder is writable           | High     | Repo checked out         | Read the dry-run output                                                 | Repo mounted `:ro`; only `packages/ui/e2e/__snapshots__` mounted for write | `scripts/ui-snapshots-docker.test.mjs`      | ⬜  | ⬜      |
| TC-UI-99-03 | Clear message when Docker is missing           | High     | Docker not installed     | Run the Docker command                                                  | Message says to install or start Docker; exit code 1                       | `scripts/ui-snapshots-docker.test.mjs`      | ⬜  | ⬜      |
| TC-UI-99-04 | Docker run regenerates the Logo snapshots      | High     | Docker running, on a Mac | Run `pnpm --filter @tafsila/ui test:visual:update:docker`, commit, push | 4 new Logo images per story; second run changes no file; CI passes         | Manual                                      | ⬜  | ⬜      |
| TC-UI-99-05 | Client error texts follow the copy rules       | High     | Repo checked out         | Run `pnpm --filter web test`                                            | Texts come from messages; no dialect words; key sets equal                 | `apps/web/src/shared/api/api-error.test.ts` | ⬜  | ⬜      |
