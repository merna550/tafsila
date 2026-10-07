# Test cases — Handbook upkeep

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #10                        |
| SRS          | none (documentation only)  |
| Area         | docs                       |
| Last updated | 2026-10-07 (by PR for #10) |

## Test data

No accounts or seed data needed. A terminal at the repo root with `pnpm install` done.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                   | Priority | Preconditions         | Steps                                                                                        | Expected result                                                                       | Automated by                       | dev | staging |
| ------------- | --------------------------------------- | -------- | --------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------- | --- | ------- |
| TC-DOCS-10-01 | docs:check passes on the branch         | High     | Branch checked out    | 1. Run `pnpm docs:check`.                                                                    | Prints `docs:check OK`, exit code 0                                                   | `pnpm docs:check` in CI            | ⬜  | ⬜      |
| TC-DOCS-10-02 | Missing card is reported by name        | High     | Branch checked out    | 1. Add `"left-pad": "1.3.0"` to a `package.json` (do not install). 2. Run `pnpm docs:check`. | Exit 1; message `Missing tech card: "left-pad" (in package.json)`                     | `scripts/check-handbook.test.mjs`  | ⬜  | ⬜      |
| TC-DOCS-10-03 | Broken relative link is reported        | High     | Branch checked out    | 1. Change a link in `docs/handbook/README.md` to `missing.md`. 2. Run `pnpm docs:check`.     | Exit 1; message names the file and `missing.md`                                       | `scripts/check-handbook.test.mjs`  | ⬜  | ⬜      |
| TC-DOCS-10-04 | Broken anchor is reported               | Medium   | Branch checked out    | 1. Change a link to `glossary.md#does-not-exist`. 2. Run `pnpm docs:check`.                  | Exit 1; message `broken anchor`                                                       | `scripts/check-handbook.test.mjs`  | ⬜  | ⬜      |
| TC-DOCS-10-05 | Check runs in quality and CI            | High     | PR open on GitHub     | 1. Run `pnpm quality`. 2. Open the Code quality run of the PR.                               | `docs:check` runs in both                                                             | CI quality workflow                | ⬜  | ⬜      |
| TC-DOCS-10-06 | Lychee runs on docs PRs                 | Medium   | PR touching `docs/**` | 1. Open the PR checks. 2. Open the `Docs links` run.                                         | The run exists; broken external links show as a warning and never fail the PR         | `.github/workflows/docs-links.yml` | ⬜  | ⬜      |
| TC-DOCS-10-07 | Lychee weekly opens an issue on failure | Low      | Default branch        | 1. Run the workflow manually (`workflow_dispatch`) while a dead link exists.                 | An issue "docs: broken external links (weekly check)" is opened with the report       | manual only                        | ⬜  | ⬜      |
| TC-DOCS-10-08 | PR template has the Concepts section    | Medium   | Branch checked out    | 1. Open a new PR.                                                                            | "Concepts introduced" appears with its hint comment                                   | manual only                        | ⬜  | ⬜      |
| TC-DOCS-10-09 | /explain, /learn, /onboard work         | Medium   | Claude Code open      | 1. Run `/explain RLS`, `/learn hexagonal`, `/onboard beginner`.                              | Each follows its command file, links resolve, no file is changed (`git status` clean) | manual only                        | ⬜  | ⬜      |

Mobile: not applicable.

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
