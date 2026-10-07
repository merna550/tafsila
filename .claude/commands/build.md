---
description: Implement a ready issue from its plan (use the model in its build:* label)
argument-hint: #<issue>
---

Follow docs/WORKFLOW.md and CLAUDE.md. Issue: $ARGUMENTS

1. Require `status:ready` (or `status:changes-requested`). Read the issue and its plan comment; read only the files the plan names.
2. Set `status:in-progress` and move the card: `scripts/gh-project.sh status <issue-url> "In progress"`. Branch from main: `feat|fix|chore/<N>-<slug>`.
3. Implement in small conventional commits referencing #N. Write tests first for bugs.
   As soon as an acceptance criterion is met **and verified**, tick it: `scripts/gh-ac.sh check N <n…>` (`scripts/gh-ac.sh list N` shows the numbers; `uncheck` if it regresses).
4. Run `pnpm lint && pnpm typecheck && pnpm test` (and `pnpm test:e2e` when UI flows change). Fix until green. If stuck twice on the same error, comment on the issue and suggest escalating the build:* model.
5. Docs in the same branch (Definition of Done, docs/WORKFLOW.md §5):
   - SRS, DECISIONS.md, CLAUDE.md status, `docs/plans/<N>-<slug>.md`.
   - Manual test cases file from `docs/test-cases/_TEMPLATE.md`; run `scripts/test-case-index.sh`.
   - Handbook (every PR): add the glossary entry, tech card (`docs/handbook/tech/_TEMPLATE.md`, `packages:` front matter) or pattern page for each new library, pattern or term; add a row at the top of `docs/handbook/learning-log.md`; fill the PR's "Concepts introduced" section (or write "None"). `pnpm docs:check` (part of `pnpm quality`) fails when a dependency has no card or a relative link is broken.
   - Backend: `pnpm api:openapi && pnpm api:postman`, `pnpm api:test` green on local, seed data + seed-data.md, tutorial updates.
6. Run `scripts/gh-ac.sh progress N`; it should be N/N. Any unticked criterion needs a reason in the PR body.
   Push and open the PR from the template with `Closes #N`, SRS IDs, the "Concepts introduced" section, the `progress` line, test summary, screenshots for visual changes, and the preview URL once Vercel posts it:
   - same labels as the issue (except status) and the **same milestone**: `gh pr create … --milestone "$(gh issue view N --json milestone --jq .milestone.title)"`
   - add the PR to the board and move the issue card: `scripts/gh-project.sh add <pr-url> "In review"` and `scripts/gh-project.sh status <issue-url> "In review"`.
7. Set `status:in-review` on the issue. Tell Merna in Arabic (max 5 lines): PR link, preview link, what to check.
