# Plan #186 · Every PR is linked to its issue and closes it on merge

The issue body is the plan (`plan:none`), plus the scope-addition comment about PR bases. Decision: [ADR-186](../decisions/186-pr-issue-link.md).

- Rule: `Closes #N` first line of the PR body; base `main`. Template, `build.md` step 6 and `docs/WORKFLOW.md` updated.
- `.github/workflows/pr-link.yml` runs `scripts/pr-link.mjs` (pure `planPrLink`, tested with fixtures in `scripts/fixtures/pr-link/`): adds a missing `Closes #N`, comments and labels `needs:link` for `Part of #N`, fails a base other than `main` unless labelled `stacked`.
- Dispatcher: already finds PRs by `Closes #N` or branch name through `scripts/issue-link.mjs` (#185); reused, not duplicated.
- `/deliver`: already refuses a base other than `main` (#185); `merge` now also returns `missingOnMain`.
- `scripts/closed-issues-check.mjs`: one-off audit of closed milestone issues without a merged PR.

## Deviations

- The dispatcher needed no change: #185 already implemented the lookup by closing keyword or branch name.
- The wrong-base check is part of the same job; it is not a required check, so it only turns the PR red when the base is wrong.
