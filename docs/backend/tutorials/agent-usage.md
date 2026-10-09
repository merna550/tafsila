# Agent usage metrics

What each agent run costs, per issue, so model labels, issue sizes and `CLAUDE.md` files are tuned with data ([ADR-028](../../DECISIONS.md), issue #36).

## What is measured

One record per run, numbers and labels only (no prompts, code, file contents or secrets):

`run_id`, `issue`, `pr`, `source` (`action` | `cloud-session` | `local`), `model`, `size`, `areas`, `type`, `started_at`, `duration_s`, `num_turns`, `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_write_tokens`, `cache_hit_ratio`, `est_cost_usd`, `outcome` (`pr_opened` | `blocked` | `failed` | `timeout`), `git_sha`.

`est_cost_usd` is the [API-equivalent cost](../../handbook/glossary.md#api-equivalent-cost): Merna pays a subscription, so use it to compare runs, not as a bill.

## Where to find it

| Where                                | What                                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Issue comment                        | `🤖 Run · sonnet · 42 turns · 1.8M tokens (78% cache) · ~$2.10 est. · 23 min · PR #41`                     |
| Branch `metrics`, `agent-runs.jsonl` | One JSON line per run, from GitHub Action runs. Never on `main`; protect the branch from force-push.       |
| PR body, "Agent usage" block         | Sessions with the Stop hook (laptop, claude.ai/code): `.agent-usage.json` (git-ignored) pasted by `/build` |
| Weekly issue                         | "Agent usage report — week N", Sundays 07:00 UTC or Actions → Agent usage report → Run workflow            |

## How the data is collected

- **GitHub Action** (`claude.yml`, step "Record agent usage"): reads the action's execution file (the last `result` message: `num_turns`, `duration_ms`, `usage.*`). Field names are documented at the top of `scripts/agent-usage.mjs`; re-check them when `anthropics/claude-code-action` changes major version. The step never fails the job.
- **Sessions** (Stop hook in `.claude/settings.json`): `node scripts/agent-usage.mjs local` reads `transcript_path` from the hook input, sums `usage` once per message id, and writes `.agent-usage.json`. If the transcript is not available (for example some cloud sessions), it prints a warning and skips. These records are shown in the PR only; they are not pushed to `metrics`.
- **Storing** (`agent-usage.mjs append`): fetch `metrics`, add one line with git plumbing (the working tree is untouched), push; on a push conflict it fetches again and retries up to 4 times.

## Read the weekly report

Sections: totals and trend against the previous week, medians by size, area and model, the top 3 most expensive runs, flags, suggestions. A "run" is counted in the week it started.

| Flag                             | Meaning                                          | What to do                                                                                     |
| -------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Above 3x the median for its size | The issue was bigger than its `size:` label      | Split issues of that kind, or fix the size rubric in `/triage`                                 |
| Cache hit ratio below 50%        | Context keeps changing or runs are very short    | Start fewer, longer-lived steps; avoid re-reading large files; check for a restarted session   |
| Turns above 60                   | The agent wandered or kept retrying              | Read the `claude-transcript` artifact; improve the plan or the area `CLAUDE.md`                |
| `blocked` / `timeout`            | The run could not finish                         | Open the issue comment the agent left; fix the cause before relabelling `status:ready`         |
| Changes requested more than once | An issue had 3+ runs that opened or updated a PR | Tighten the acceptance criteria in similar issues; consider `build:opus` for this kind of work |

Suggestions are simple rules: an area whose sonnet runs all opened a PR with a median of 25 turns or fewer (at least 3 runs) can try `build:haiku`; an area with a median above 40 turns reads many files, so improve its `CLAUDE.md` and `docs/CONTEXT_MAP.md`.

## Check laptop usage by hand

Use the community tool `ccusage` (`npx ccusage daily`); it reads your local Claude Code logs. See the [Claude Code card](../../handbook/tech/claude-code.md#measuring-agent-usage).

## First-time setup checks

1. Create the `metrics` branch by running one agent build (the first `append` creates it), then protect it: Settings → Branches → add a rule for `metrics` that blocks force pushes.
2. Run the report once: Actions → Agent usage report → Run workflow. Without a `metrics` branch it exits quietly.
