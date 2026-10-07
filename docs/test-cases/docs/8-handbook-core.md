# Test cases — Core handbook

| Field        | Value                     |
| ------------ | ------------------------- |
| Issue        | #8                        |
| SRS          | none (documentation only) |
| Area         | docs                      |
| Last updated | 2026-10-07 (by PR for #8) |

## Test data

No accounts or seed data needed. Open `docs/handbook/START_HERE.md` on GitHub (so Mermaid renders) or in an editor with Markdown preview.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                 | Priority | Preconditions       | Steps                                                                            | Expected result                                                            | Automated by | dev | staging |
| ------------ | ------------------------------------- | -------- | ------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------ | --- | ------- |
| TC-DOCS-8-01 | Reading paths work                    | Medium   | PR branch on GitHub | 1. Open START_HERE.md. 2. Click every link of each of the 5 paths.               | Every link opens; every path has 5 to 10 items with a time estimate        | manual only  | ⬜  | ⬜      |
| TC-DOCS-8-02 | Mermaid diagrams render               | Medium   | PR branch on GitHub | 1. Open each of the 4 `map/` pages.                                              | Each page shows at least one rendered diagram, no "Unable to render" error | manual only  | ⬜  | ⬜      |
| TC-DOCS-8-03 | Glossary anchors resolve              | Medium   | PR branch on GitHub | 1. Open `glossary.md#rls`. 2. Open `glossary.md#sleeve-cap`.                     | The browser jumps to the entry; entries are alphabetical                   | manual only  | ⬜  | ⬜      |
| TC-DOCS-8-04 | Paths in patterns/ exist              | High     | Branch checked out  | 1. For each path in "Where in our code" of the 6 pattern pages, run `ls <path>`. | Every path exists (items marked planned are not listed as existing)        | manual only  | ⬜  | ⬜      |
| TC-DOCS-8-05 | Relative links resolve                | High     | Branch checked out  | 1. Run a link checker over `docs/handbook/**/*.md` (relative links and anchors). | 0 broken links                                                             | manual only  | ⬜  | ⬜      |
| TC-DOCS-8-06 | Troubleshooting commands are accurate | Low      | Terminal with nvm   | 1. Run the commands in the Node-version entry.                                   | They do what the entry says                                                | manual only  | ⬜  | ⬜      |

Every case covers one of: happy path, validation/errors, permissions, edge values, RTL, mobile. Not applicable here except mobile: open the handbook on a phone via GitHub and check tables scroll.

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
