# Test cases — Code generators

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #33                        |
| SRS          | NFR-12                     |
| Area         | infra                      |
| Last updated | 2026-10-14 (by PR for #33) |

## Test data

A throwaway name such as `garment-note` and the issue number `40`. Delete the generated files afterwards (`git clean`, `git checkout`).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                                  | Priority | Preconditions | Steps                                                                                        | Expected result                                                                 | Automated by                   | dev | staging |
| -------------- | -------------------------------------- | -------- | ------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------ | --- | ------- |
| TC-INFRA-33-01 | Endpoint generator output is green     | High     | Clean tree    | 1. `pnpm gen endpoint garment-note 40`. 2. `pnpm quality`. 3. Run the api and schemas tests. | Files are created, formatted; lint, typecheck, jscpd and the new tests all pass | manual only                    | ⬜  | ⬜      |
| TC-INFRA-33-02 | Feature generator output is green      | High     | Clean tree    | 1. `pnpm gen feature garment-note 40`. 2. `pnpm quality`. 3. Run the web tests.              | Folder and `ar`/`en` message keys exist; all checks and the messages test pass  | manual only                    | ⬜  | ⬜      |
| TC-INFRA-33-03 | Garment-module output is green         | High     | Clean tree    | 1. `pnpm gen garment-module hem-band 40`. 2. `pnpm quality`. 3. Run the engine tests.        | Module, validation, property test exist; all checks pass                        | manual only                    | ⬜  | ⬜      |
| TC-INFRA-33-04 | Unknown generator or bad name rejected | Medium   | none          | 1. `pnpm gen page`. 2. `pnpm gen feature Bad_Name 1`.                                        | Usage message; the name prompt refuses anything but kebab-case                  | `scripts/gen.test.mjs` (first) | ⬜  | ⬜      |
| TC-INFRA-33-05 | Existing file is never overwritten     | Medium   | Ran 01 once   | 1. Run `pnpm gen endpoint garment-note 40` again.                                            | Plop reports the files already exist and changes nothing                        | manual only                    | ⬜  | ⬜      |

## Manual run log

| Date       | Env   | Tester | Result | Notes                                                                 |
| ---------- | ----- | ------ | ------ | --------------------------------------------------------------------- |
| 2026-10-14 | local | agent  | 01-03  | All three generators run, then quality-relevant checks green (see PR) |
