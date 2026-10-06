---
description: Implement a ready issue from its plan (use the model in its build:* label)
argument-hint: #<issue>
---

Follow docs/WORKFLOW.md and CLAUDE.md. Issue: $ARGUMENTS

1. Require `status:ready` (or `status:changes-requested`). Read the issue and its plan comment; read only the files the plan names.
2. Set `status:in-progress`. Branch from main: `feat|fix|chore/<N>-<slug>`.
3. Implement in small conventional commits referencing #N. Write tests first for bugs.
4. Run `pnpm lint && pnpm typecheck && pnpm test` (and `pnpm test:e2e` when UI flows change). Fix until green. If stuck twice on the same error, comment on the issue and suggest escalating the build:* model.
5. Docs in the same branch (Definition of Done, docs/WORKFLOW.md §5):
   - SRS, DECISIONS.md, CLAUDE.md status, `docs/plans/<N>-<slug>.md`.
   - Manual test cases file from `docs/test-cases/_TEMPLATE.md`; run `scripts/test-case-index.sh`.
   - Backend: `pnpm api:openapi && pnpm api:postman`, `pnpm api:test` green on local, seed data + seed-data.md, tutorial updates.
6. Push, open a PR from the template with `Closes #N`, SRS IDs, test summary, screenshots for visual changes, and the preview URL once Vercel posts it.
7. Set `status:in-review`. Tell Merna in Arabic (max 5 lines): PR link, preview link, what to check.
