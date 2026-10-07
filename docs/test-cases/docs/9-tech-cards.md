# Test cases — Technology cards

| Field        | Value                     |
| ------------ | ------------------------- |
| Issue        | #9                        |
| SRS          | none (documentation only) |
| Area         | docs                      |
| Last updated | 2026-10-07 (by PR for #9) |

## Test data

No accounts or seed data needed. Open `docs/handbook/tech/README.md` on GitHub (so Mermaid renders) or in an editor with Markdown preview.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                       | Priority | Preconditions       | Steps                                                                                                                                   | Expected result                                                                      | Automated by            | dev | staging |
| ------------ | ------------------------------------------- | -------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------- | --- | ------- |
| TC-DOCS-9-01 | Every card has all sections                 | High     | Branch checked out  | 1. For each file in `docs/handbook/tech/` (except README and _TEMPLATE), check the template headings.                                   | All 9 template sections are present and non-empty                                    | manual only             | ⬜  | ⬜      |
| TC-DOCS-9-02 | Index lists all cards                       | High     | Branch checked out  | 1. Count card files. 2. Count rows in the `tech/README.md` index.                                                                       | Same number; each link opens the card                                                | manual only             | ⬜  | ⬜      |
| TC-DOCS-9-03 | Every dependency is covered                 | High     | Branch checked out  | 1. List dependencies of all `package.json` files (not `@tafsila/*`, `@types/*`). 2. Search each in the cards' `packages:` front matter. | None missing                                                                         | `pnpm docs:check` (#10) | ⬜  | ⬜      |
| TC-DOCS-9-04 | Paths in 'Where it lives' exist             | High     | Branch checked out  | 1. For each backticked path in that section, run `ls <path>`.                                                                           | Every path exists; planned items are written without code formatting and say planned | manual only             | ⬜  | ⬜      |
| TC-DOCS-9-05 | Relative links and glossary anchors resolve | High     | Branch checked out  | 1. Run a link checker over `docs/**/*.md`.                                                                                              | 0 broken links                                                                       | `pnpm docs:check` (#10) | ⬜  | ⬜      |
| TC-DOCS-9-06 | Glossary Card links open                    | Medium   | PR branch on GitHub | 1. Open `glossary.md#rls`. 2. Click its Card link.                                                                                      | The Supabase card opens                                                              | manual only             | ⬜  | ⬜      |
| TC-DOCS-9-07 | Volatile facts have a date and source       | Medium   | PR branch on GitHub | 1. Read Vercel, Supabase, Inngest, Paymob, Node.js, Sentry-PostHog cards.                                                               | Each states a checked-on date and links to the source                                | manual only             | ⬜  | ⬜      |
| TC-DOCS-9-08 | Next.js and Node.js explain the full choice | Medium   | PR branch on GitHub | 1. Read both cards.                                                                                                                     | They explain why not a separate SPA and why not Python on the backend                | manual only             | ⬜  | ⬜      |

Mobile: open a card on a phone via GitHub; code blocks and tables scroll.

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
