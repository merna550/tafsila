# Plan 178: keep the builder on CI until green

- Add `scripts/ci-wait.mjs` to poll the pull request head through `gh api`, report mergeability, and return 0 for green, 1 for red or 2 after 25 minutes.
- Keep agent output small by stripping ANSI sequences and printing at most 40 matching failure lines per failed job.
- Cover the extractor and green, red and timeout polling states with a saved Vitest log fixture.
- Update the shared build procedure so local and dispatcher builds wait, fix and push for at most three rounds before blocking.
- Document the workflow and manual dry run; no SRS or architecture decision changes are needed for this process-only issue.
