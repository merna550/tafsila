# Plan #83: cut GitHub Actions minutes (part 2)

Decisions: [ADR-83](../decisions/83-ci-minutes.md), builds on [ADR-86](../decisions/86-cut-actions-minutes.md).

1. `supabase` target in `scripts/ci-paths.mjs`; `supabase.yml` gets a `scope-db` job, a gated `db-reset`, and `concurrency` that cancels superseded PR runs.
2. `docs-links.yml` cancels superseded PR runs.
3. `actions/cache@v4` for `~/.cache/ms-playwright` before `playwright install` in the Storybook and e2e jobs.
4. Dispatcher cron every 12 hours; tests and docs updated.
5. `docs/backend/ci-minutes.md` (what costs minutes, how to read Usage), ADR-83, test cases, learning log.
6. Open: Billing page numbers from Merna (acceptance criterion 1).
