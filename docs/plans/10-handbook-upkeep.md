# Plan #10: Keep the handbook alive

Issue: #10 · plan:none · build:sonnet · Milestone: M0 - Foundation & environments

The issue body is the plan (`plan:none`). What was done:

1. **PR rule:** "Concepts introduced" section in the PR template; new Definition of Done item in WORKFLOW section 5.
2. **Commands:** `/explain`, `/learn`, `/onboard` in `.claude/commands/` (read-only); `/build` now adds the handbook entries, the learning-log row and the PR section; `/review` fails when a new dependency has no card.
3. **`scripts/check-handbook.mjs`** (`pnpm docs:check`): every direct dependency of every workspace `package.json` (not `@tafsila/*`, `@types/*`) must be in some card's `packages:`; every relative link and anchor in `docs/` must resolve. Front matter is parsed as real YAML with the `yaml` package ([ADR-015](../DECISIONS.md)), so Prettier reflowing the list is safe; `packages: []` is valid; planned packages need not be installed; anchors accept `<a id>` and GitHub heading slugs.
4. **Tests:** `scripts/check-handbook.test.mjs` (Vitest, throw-away fixture repos) includes the deliberate failing examples (missing card, broken link, broken anchor). Wired to `pnpm test` via `pnpm test:docs`.
5. **CI:** `pnpm docs:check` and `pnpm test:docs` in the Code quality workflow; `pnpm docs:check` in `pnpm quality`. New `.github/workflows/docs-links.yml` (lychee, pinned by commit SHA): docs PRs (non-blocking) and weekly (opens an issue).
6. **New card** `handbook-checks.md` (covers the new `yaml` dependency); glossary entries `docs:check` and `lychee`; handbook README "How the handbook stays current"; CLAUDE.md commands and status.

## Known, not fixed here

`scripts/gen-postman.mjs` imports `openapi-to-postmanv2`, which is in no `package.json`, and `pnpm api:postman` / `pnpm api:test` are not defined yet.

## Verification

`pnpm quality && pnpm test` green; `pnpm docs:check` passes; sample runs of the three commands are in the PR body.
