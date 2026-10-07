# Run agents in the cloud (laptop off)

Two ways, no Claude GitHub App ([ADR-016](../../DECISIONS.md)):

| Way                              | Best for                       | Uses                                         |
| -------------------------------- | ------------------------------ | -------------------------------------------- |
| **claude.ai/code** (web / phone) | Long tasks, you start them     | Claude subscription limits                   |
| **GitHub Action + dispatcher**   | Hands-off, one issue at a time | Subscription limits + GitHub Actions minutes |

## One-time setup (about 15 minutes)

1. **Connect GitHub to claude.ai/code.** In a terminal inside the repo, run `claude`, then `/web-setup`. It uses your existing `gh` login; no App is installed.
2. **Create the claude.ai/code environment.** Open claude.ai/code → environments → new environment for `merna550/tafsila` with network access set to **Trusted**. Cloud sessions set `CLAUDE_CODE_REMOTE=true`, which makes the SessionStart hook install dependencies (`scripts/agent-setup.sh`: corepack + `pnpm install --frozen-lockfile`; on your laptop it does nothing).
3. **Create `AGENT_GITHUB_TOKEN`** (GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens**):
   - Resource owner: you. Repository access: **Only select repositories** → `tafsila`.
   - Permissions: Contents, Pull requests, Issues: **Read and write**. Nothing else.
   - Expiration: **90 days**. Add a calendar reminder for day 80.
   - Save it: repo → Settings → Secrets and variables → Actions → New repository secret `AGENT_GITHUB_TOKEN`.
   - Why not the default token: PRs opened with `GITHUB_TOKEN` do not start CI, so quality checks would never run on agent PRs.
4. **Create `CLAUDE_CODE_OAUTH_TOKEN`.** Run `claude setup-token` in a terminal, copy the token it prints, and save it as the repo secret `CLAUDE_CODE_OAUTH_TOKEN`. Never paste either token in an issue, comment or commit.

## Start a task

- **claude.ai/code (web or phone):** pick the repo and the environment, type `/build #<issue>`. The issue must be `status:ready`.
- **Comment:** write `@claude <what to do>` on an issue or PR. Only comments from Merna run.
- **Automatic:** the dispatcher (`.github/workflows/dispatch.yml`) runs every 2 hours. It builds the highest-priority `status:ready` issue whose "Depends on" issues are closed and that has no `needs:decision`. You can run it now: Actions → Dispatch agent → Run workflow.

To check what it would pick without spending a Claude run, tick **dry_run** in the Run workflow form: the `dry-run` job prints the issue and model and Claude is not called.

The dispatcher starts nothing when an issue is already `status:in-progress` (`DISPATCH_MAX_PARALLEL`, default 1; with 2 the second must be in a different `area:*`) or when 3 or more PRs wait for your review, and it starts at most `DISPATCH_DAILY_LIMIT` builds per UTC day (repo variable, default 4). Its run summary says what it picked and why, or why not (for example "Daily limit reached: 4 build(s) today").

## Follow progress

- claude.ai/code: the session page (also on your phone).
- Action: Actions tab → "Claude agent" run for the issue. Its **claude-transcript** artifact (kept 7 days) shows what Claude did and why it stopped.
- The issue card moves on the board and the issue label becomes `status:in-progress`, then `status:in-review` with a PR link.

## Stop

- claude.ai/code: stop the session.
- Action: Actions → the running "Claude agent" run → **Cancel workflow**. Each issue has its own concurrency group, so runs for one issue never overlap. The job times out after 60 minutes.
- Then put the issue back to `status:ready` (or `status:blocked`).

The agent also stops by itself: every Action run ends after 50 turns (`--max-turns 50`), and an unattended agent that fails twice on the same problem comments the problem on the issue, sets `status:blocked` and stops; it never switches to a bigger model on its own (ADR-017). Read its comment, fix the cause or change the `build:*` label, then set `status:ready` again.

## Current state: dispatcher is OFF

The repo variable `DISPATCH_ENABLED` is `false`, so the dispatcher starts nothing on its own. `@claude` comments and claude.ai/code still work. The cost guards it waited for (issue #17) are in place: once that PR is merged, turn it on by setting `DISPATCH_ENABLED` to `true` (or deleting it), optionally set `DISPATCH_DAILY_LIMIT`, and remove this section.

## Pause the dispatcher

Repo → Settings → Secrets and variables → Actions → Variables → set `DISPATCH_ENABLED` to `false`. Set it to `true` (or delete it) to resume.

## Cost

- claude.ai/code and the Action both use your Claude subscription limits (the Action uses the OAuth token, not an API key).
- The Action also uses GitHub Actions minutes; private repos have a limited free quota. Prefer claude.ai/code for long tasks. The one-issue-at-a-time rule and the daily limit keep minutes low; a run is capped at 60 minutes and 50 turns.

## Renew the token

`AGENT_GITHUB_TOKEN` expires after 90 days. Before it does: create a new fine-grained token with the same settings, update the repo secret, delete the old token. If it expires, the dispatcher and `@claude` runs fail on checkout.

## Safety

The agent never pushes to `main`, never deploys to production and never reads secrets (CLAUDE.md rule 1 and 6). The token is limited to this repo with three permissions. Auto-fix on PRs needs the GitHub App, so it is not used.

## Troubleshooting

- Run does nothing on `@claude`: the comment must come from `merna550` and contain `@claude`.
- CI does not run on the agent's PR: `AGENT_GITHUB_TOKEN` is missing or the default token was used.
- Dependencies missing in a cloud session: check the environment network is "Trusted" and that `CLAUDE_CODE_REMOTE=true` is set by the session.
