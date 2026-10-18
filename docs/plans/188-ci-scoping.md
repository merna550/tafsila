# Plan: #188 every check runs only when a change can affect it

## Goal

CI runs a check only when the changed files can change its result (like Storybook runs only for `packages/ui`). Much of this exists already (issues #17, #83, #86, #90, #94: `scripts/ci-paths.mjs` for `storybook`, `docker`, `e2e`, `supabase`, `api`; `scripts/ci-scope.sh` for lint and `turbo --filter` on PRs; `lychee` only for `docs/**`). The gaps below still make a docs-only or engine-only PR run far more than needed; during M2 every engine PR also ran the full web e2e and the Docker build, and `main` re-ran everything after each merge.

## Where the checks still run for every change (measured on the workflow files)

1. `quality` job, steps that always run: `prettier --check .` (whole repo), `jscpd .`, `depcruise`, `docs:check`, `tokens:check`, `test:docs` (the tests of `scripts/`).
2. `quality` on `push` to `main`: scope is "everything" (`filter=` empty, `lint_files=all`), so each merged PR (even a plan or a docs change) lints, typechecks and tests all packages again.
3. `e2e` includes the whole `packages/schemas` and `packages/utils`; engine-only contracts in schemas (`pattern*.ts`, `engine-options*.ts`, `json/`) trigger the full web e2e although the web app does not import them yet.
4. `docker` ("build") includes every `packages/**` file, also `packages/test-fixtures/`, `packages/engine/scripts/` and `packages/engine/src/**/*.snap|*.svg` (only tests and docs are excluded).
5. `Staging` (migrate + deploy + smoke) runs on every push to `main`, also for docs or agent-config only merges.
6. No Turborepo cache is restored in CI ("cache miss, executing" for every task).

## Scope

- `scripts/ci-paths.mjs`: add targets with the same rule-table style and unit tests in `scripts/ci-paths.test.mjs`:
  - `format`: not a target; `prettier --check` runs on the changed files only on PRs (pass the list from `ci-scope.sh`), everything on `main` nightly.
  - `jscpd` and `depcruise`: only when a file under `apps/` or `packages/` (not tests, snapshots, `.md`) or their config changed.
  - `docs`: `docs:check` only when `docs/**`, `**/*.md`, any `package.json` (dependency cards) or `scripts/check-handbook.mjs` changed.
  - `tokens`: only when `packages/ui/**`, `docs/design-system/**` or `apps/web/src/**/*.css` changed.
  - `scripts`: `test:docs` only when `scripts/**` or the docs/handbook checks changed.
    They stay **steps of the `quality` job** (like `api`), so the required check name never disappears; a skipped step prints one line in the job summary ("skipped: no relevant changes").
- `e2e` and `docker` rule tables refined as in points 3 and 4 above (engine-only schema files, `test-fixtures`, `packages/engine/{scripts,**/__snapshots__}` and `.svg|.snap` no longer trigger them); `packages/engine/src/**` still triggers `docker` because the web app depends on `@tafsila/engine`.
- `main`: `quality` on push uses the same diff (`before..sha`) as the PR run; a **nightly** full run (`schedule`, 03:00 UTC) keeps the "check everything" safety net.
- `Staging`: documented decision (not implemented here): keep deploying every merge so `/api/health` `gitSha` equals the merge commit (TC-INF-19-02); skipping docs-only merges needs a decision from Merna.
- Turbo cache: restore and save `.turbo` with `actions/cache` (key `turbo-${{ runner.os }}-${{ github.sha }}`, `restore-keys: turbo-${{ runner.os }}-`) in the `quality` job so unchanged tasks are cache hits. Remote cache (`TURBO_TOKEN`) is out of scope (secret and account decision).
- Evidence: a script `scripts/ci-savings.mjs` replays the new rules over the last 30 merged PRs (file lists from the GitHub API) and prints, per target, in how many PRs it would have run before and after; the numbers go into the PR body.
- Docs: a table "which check runs for which paths" in `docs/WORKFLOW.md` §CI (generated from the rule tables by `ci-paths.mjs --table`, checked by `docs:check`); learning-log row.

## Acceptance criteria

- [ ] A docs-only PR runs: prettier on its files, `docs:check`, `lychee`; it skips jscpd, depcruise, tokens, scripts tests, e2e, docker, storybook, db-reset (checked on a test PR).
- [ ] An engine-only PR (`packages/engine/src/**`) skips e2e (unless it touches files the web uses), storybook, db-reset, tokens, `docs:check`, `api:check`.
- [ ] A `packages/ui` change still runs storybook, tokens and e2e.
- [ ] A change to `package.json`, `pnpm-lock.yaml` or `turbo.json` still runs everything.
- [ ] A skipped check never blocks a merge: the required checks (`quality`, `build`, `e2e`, `db-reset`, `storybook`) report success when skipped.
- [ ] `ci-paths.test.mjs` covers every target (include, exclude and the "unknown change = run" fallback).
- [ ] Second run of an unchanged package task is a Turbo cache hit in CI (log line).
- [ ] The nightly full run exists and `main` pushes are scoped.
- [ ] `ci-savings` numbers are in the PR; docs table added.

## Out of scope

Skipping the staging deploy for docs-only merges (needs a decision); Turbo remote cache; changing which checks are required on `main`.

## SRS

None (process).

## Deviations

- `format`, `jscpd`, `depcruise`, `docs`, `tokens`, `scripts` are decided by one `ci-paths.mjs steps` call (outputs per step) instead of one call per step. `format` is scoped by `ci-scope.sh` (`format_files`).
- The nightly schedule is only on `quality.yml` (the docker workflow pushes images on the default branch, so no schedule there); `ci-savings` replays the rules over merged PRs.
