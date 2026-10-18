# ADR-186 · 2026-10-18 · Every PR closes its issue, and its base is main

## Context

Several agent PRs said `Part of #N`, so GitHub neither linked nor closed the issue and someone closed it by hand. PR #172 (issue #131) had the base `feat/130-seam-allowance`: it merged into an already-merged branch, closed #131, and its code never reached `main`.

## Decision

- A PR for an issue has `Closes #N` as the first line of its body (template, `build.md`). `Part of #N` is not used.
- `.github/workflows/pr-link.yml` (`scripts/pr-link.mjs`) finds the issue from the branch (`<type>/N-…`) or a `(#N)` title suffix. No closing keyword: it adds `Closes #N`. Only `Part of #N`: it comments and adds `needs:link`. Base other than `main` without the label `stacked`: the job fails ("base must be main"). It is not a required check and passes (with a notice) for PRs that name no issue and for forks.
- Builders create PRs with `--base main`; a build that depends on an unmerged PR waits or merges that branch with `git merge`.
- `/deliver` already refuses a base other than `main` (#185); after merging it now lists files of the PR missing on `main` (`missingOnMain`) and blocks.
- The dispatcher finds a PR by `Closes #N` or branch name only (`issue-link.mjs`, #185).
- `scripts/closed-issues-check.mjs` is the one-off audit of closed issues without a merged PR.

## Alternatives

Making `pr-link` a required check: rejected, it would block ordinary PRs for a missing keyword it can repair itself.
