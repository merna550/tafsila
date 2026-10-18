# Plan: board column and acceptance criteria without GraphQL (#183)

Cloud agent sessions get HTTP 403 on GitHub GraphQL, so `gh issue view|edit` (used by `gh-ac.sh`) and `gh project` (used by `gh-project.sh`) fail there.

- `scripts/gh-ac.sh` reads and patches the issue body through REST (`gh api repos/{o}/{r}/issues/N`). `TAFSILA_REPO` overrides the repository.
- `.github/workflows/board-sync.yml` moves the card on `issues: labeled/unlabeled/closed` and `pull_request: opened/closed`. The column comes from `scripts/board-column.mjs` (the table in WORKFLOW.md section 8). The board is user-owned, so the job needs the secret `PROJECT_TOKEN` (token with the `project` scope); it falls back to the repo token.
- `scripts/gh-project.sh` prints a clear message and exits 0 when `CLAUDE_CODE_REMOTE=true`.
- `build.md`, `plan.md`, `ship.md` and WORKFLOW.md no longer tell agents to move cards.
- Tests: `scripts/gh-ac.test.mjs` runs the REST path against a recorded issue body with a fake `gh` that fails on any non-REST call.

Open item for Merna: add the `PROJECT_TOKEN` secret, then verify once on a test issue (acceptance criteria 2 and 3).
