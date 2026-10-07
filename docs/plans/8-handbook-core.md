# Plan #8: Core handbook

Issue: #8 · plan:none · build:sonnet · Milestone: M0 - Foundation & environments

The issue body is the plan (`plan:none`). Summary of what was done:

1. **Structure:** `docs/handbook/` with README, START_HERE (5 reading paths), `map/` (overview, request-journey, pattern-journey, repo-tour), glossary, `patterns/` (6 pages), code-style, `tech/` (README index + `_TEMPLATE.md`), troubleshooting (4 incidents), learning-log.
2. **Accuracy rule:** every file path, command and code excerpt was read from this repo first. Designed-but-unbuilt things (services, adapters, features, Supabase, AI, Paymob) are marked "planned" with the SRS section or ADR.
3. **Glossary:** one entry per term with an explicit `<a id="...">` anchor so other docs can link `glossary.md#rls`. `Card:` is plain text (for example "Supabase (planned in #9)") until #9 creates the cards, so no link is dead.
4. **Docs touched:** `CLAUDE.md` (doc map and status), `docs/WORKFLOW.md` section 6, `docs/DECISIONS.md` (ADR-010), this plan, test cases `docs/test-cases/docs/8-handbook-core.md`.
5. **Handoff to #9 and #10:** `tech/README.md` is an index with an empty table; `tech/_TEMPLATE.md` follows the issue exactly. When #9 adds a card, replace the plain-text `Card:` in the glossary with a link.

## Verification

- All relative links and glossary anchors in `docs/handbook/` resolve (checked with a script).
- External links checked for HTTP 200 or a redirect.
- `pnpm quality && pnpm test` green.
