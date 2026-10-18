# ADR-185 · 2026-10-18 · /deliver merge gate, ownership and fix budget

Issue #185. Status: accepted (cheap to reverse; all rules live in `scripts/deliver-rules.mjs`).

- **D1 Merge mechanism.** Direct squash merge by `deliver.mjs merge` after its own gate, with the head `sha` pinned. Auto-merge is not used (off at repo level, would merge after the session and skip the post-merge base check, knows nothing about our extra conditions). Branch protection is recommended as a second guard, not a dependency.
- **D2 Required checks.** `quality`, `build`, `e2e`, `db-reset`, `storybook` must be present and green or skipped on the head; every other check run and the Vercel status must not be red. One constant, `REQUIRED_CHECKS`.
- **D3 Ownership.** `agent:auto` = dispatcher only; `/deliver` refuses it. The dispatcher skips issues with any `status:*` besides `ready` and issues with an open PR (matched by closing keyword or branch name, never a plain mention).
- **D4 Fix budget.** The builder keeps its 3 CI rounds (build.md); `/deliver` adds at most 2 resends (red or conflict) per issue; the same cause twice means `status:blocked` (rule 9). Conflicts are fixed by merging `origin/main`, never by rebase or force-push.
- **D5 Queue.** Strictly sequential: dependency order, then priority, then number. A single-issue refusal skips it; any blocked, safety or base stop ends the queue; after each merge the queue waits for `quality` and `Staging` on the merge commit.
- **D6 Criteria and Claude config.** Merge needs `gh-ac` N/N or a `## Unticked criteria` section in the PR body; `needs:interactive` issues merge only after Merna's own "merge" message.
