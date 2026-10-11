# What costs GitHub Actions minutes

The repo is private and on the GitHub Free plan: 2,000 Actions minutes a month for the whole account, no payment method (ADR-022). When they run out every job fails in a few seconds with "recent account payments have failed or your spending limit needs to be increased". Decisions: [ADR-86](../decisions/86-cut-actions-minutes.md), [ADR-83](../decisions/83-ci-minutes.md).

## Read the usage

- **Billing page:** GitHub > Settings > Billing and plans > Usage. Filter by repository and group by workflow (sku "Actions Linux"). Compare "Included minutes used" with 2,000.
- **From the terminal:** `node scripts/actions-usage.mjs --days 30` prints runs and minutes per workflow (needs a token that can read Actions).
- Minutes are rounded up per job, so many tiny jobs cost more than their wall-clock time (a 10-second `scope-*` job bills one minute).

## What costs minutes, and what already limits it

| Workflow / job         | Runs when                                                 | Limits                                                                 |
| ---------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| Code quality `quality` | every PR and push to `main`                               | affected-only lint, typecheck, tests; superseded PR runs are cancelled |
| `storybook`            | `packages/ui`, root toolchain files, `quality.yml` change | `scope-storybook` + job `if`; Playwright browsers cached               |
| Web e2e                | web, its packages, `supabase/` or its workflow change     | `scope-e2e` + job `if`; Playwright browsers cached                     |
| Docker image           | web, packages, Docker files change; multi-arch on `main`  | `scope-docker` + job `if`; superseded PR runs cancelled                |
| Supabase `db-reset`    | `supabase/**`, root toolchain files, its workflow change  | `scope-db` + job `if`; superseded PR runs cancelled                    |
| Docs links `lychee`    | PRs touching `docs/**`; weekly                            | `on.paths`; it is never a required check; superseded runs cancelled    |
| Dispatch agent         | issue/PR events, every 12 hours, by hand                  | builds only `agent:auto` issues; `DISPATCH_DAILY_LIMIT` per UTC day    |
| Claude agent           | `@claude` comment or a dispatcher call                    | `--max-turns 50`, one issue at a time                                  |
| Staging                | every merge to `main`                                     | one run at a time                                                      |

A job skipped by its `if` still reports success, so a required check never blocks a merge. Do not use `on.paths` for a check that may be required: it would stay "expected" forever.

## Rules of thumb

- **Batch pushes per PR:** commit locally, run `pnpm quality && pnpm test` before pushing, push once per group of changes. Each push starts every workflow (cancelling is a fallback, not a saving: the cancelled run already used minutes).
- Open PRs as drafts while work continues and keep docs-only changes in their own PR (they skip the heavy jobs).
- Prefer a manual `workflow_dispatch` dry run over more cron runs when testing the dispatcher.
- Check the Usage page around day 10 of the month; if more than half is gone, pause the dispatcher with the repo variable `DISPATCH_ENABLED=false`.
- Never add a payment method or raise the spending limit (ADR-022). If minutes run out, Merna decides per PR whether to merge after local checks.
