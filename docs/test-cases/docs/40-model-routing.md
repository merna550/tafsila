# Test cases — Model routing for /build and /plan

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #40                        |
| SRS          | NFR-12                     |
| Area         | infra                      |
| Last updated | 2026-10-07 (by PR for #40) |

## Test data

Issues labelled `build:haiku`, `build:opus`, `plan:none`, and one with no `build:*` / `plan:*` label. A PR whose body says `Closes #<issue>`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                                    | Priority | Preconditions             | Steps                                              | Expected result                                                      | Automated by                   | dev | staging |
| -------------- | ---------------------------------------- | -------- | ------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------ | --- | ------- |
| TC-INFRA-40-01 | Label maps to model and subagent         | High     | none                      | Run `pnpm test:docs`                               | `build:x` → `builder-x`, `plan:x` → `planner-x`                      | `scripts/agent-model.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-40-02 | Missing label falls back to sonnet       | High     | none                      | Run `pnpm test:docs`                               | Sonnet is used and the note says why                                 | `scripts/agent-model.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-40-03 | PR comment uses the linked issue         | High     | none                      | Run `pnpm test:docs`                               | Closing reference first, then `Closes/Fixes/Resolves #N` in the body | `scripts/agent-model.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-40-04 | Subagent files match the resolver        | High     | none                      | Run `pnpm test:docs`                               | Five files exist with the right `model:` and `maxTurns: 50`          | `scripts/agent-model.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-40-05 | /build delegates to the label's builder  | High     | `build:haiku` ready issue | Run `/build #N` in a sonnet session                | `builder-haiku` subagent runs; main session only relays its summary  | manual only                    | ⬜  | ⬜      |
| TC-INFRA-40-06 | /build without a label says so           | Medium   | Issue with no `build:*`   | Run `/build #N`                                    | One Arabic line says sonnet is used; `builder-sonnet` runs           | manual only                    | ⬜  | ⬜      |
| TC-INFRA-40-07 | /plan skips plan:none                    | Medium   | `plan:none` issue         | Run `/plan #N`                                     | One Arabic line says no plan is needed; no planner runs              | manual only                    | ⬜  | ⬜      |
| TC-INFRA-40-08 | `@claude` on a PR uses the issue's model | High     | Secrets set, linked PR    | Comment `@claude` on a PR for a `build:opus` issue | "Resolve issue and model" step prints `"model":"opus"`               | manual only                    | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
