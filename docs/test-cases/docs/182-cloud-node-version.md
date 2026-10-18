# Test cases — Cloud sessions run the same checks as CI

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #182                        |
| SRS          | None (process)              |
| Area         | infra                       |
| Last updated | 2026-10-18 (by PR for #182) |

## Test data

A fresh claude.ai/code session on the `tafsila` environment, or `GITHUB_ACTIONS=true bash scripts/agent-setup.sh` locally.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID              | Title                         | Priority | Preconditions                            | Steps                                                             | Expected result                                                      | Automated by | dev | staging |
| --------------- | ----------------------------- | -------- | ---------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- | ------------ | --- | ------- |
| TC-INFRA-182-01 | Node matches in fresh session | High     | Setup script pasted in the environment   | 1. Start a session. 2. Run `node -v`, `pnpm quality && pnpm test` | Node 22.22.2 or newer; `agent-setup: ready`; no `engine-strict` flag | manual only  | ⬜  | ⬜      |
| TC-INFRA-182-02 | Wrong Node fails loudly       | High     | Node below `engines`, nodejs.org blocked | 1. Run `GITHUB_ACTIONS=true bash scripts/agent-setup.sh`          | Prints `agent-setup: FAILED (wrong Node ...)` with the fix, exit 1   | manual only  | ⬜  | ⬜      |
