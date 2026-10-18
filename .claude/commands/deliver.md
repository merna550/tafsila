---
description: From an approved plan to a merged PR (build, CI, fix, merge, next issue)
argument-hint: "#<issue> [#<issue> ...] | next [k]"
---

Arguments: $ARGUMENTS. You are a router with a merge gate (issue #185, decisions in `docs/decisions/185-deliver-merge-gate.md`). All GitHub decisions are made by `node scripts/deliver.mjs <command>` (REST only, one JSON line each; add `--dry-run` to see `would: ...` lines without writing). Builders do the code work. Process **one issue at a time**; waiting happens inside `--wait`, not in your turns.

## Algorithm

0. `node scripts/deliver.mjs doctor`. If it fails: one Arabic line with the problem, stop.
1. `Q=$(node scripts/deliver.mjs queue $ARGUMENTS)`. Print every `refuse` as an Arabic line. Nothing buildable: stop.
2. `node scripts/deliver.mjs base --wait`. State `red`: stop with "main is red (<names>)".
3. For each issue N in the queue, strictly in order:
   a. `preflight N` again (state may have changed). `refuse`: record the line, continue with the next issue.
   b. `build`: `start N`, then run the `agent` from the queue entry in the **foreground** (`run_in_background: false`) with the prompt: `Build issue #N following .claude/procedures/build.md. Delivered by /deliver: branch <type>/N-<slug> from origin/main (not the session branch), do not merge.` `resume`: skip the builder. A summary ending `BLOCKED:` is recorded and **stops the queue**.
   c. `find-pr N`. None: `block N --reason "builder ended without a PR"`, stop the queue.
   d. Loop with `resends=0`, `prev=[]`: `V=gate N --pr P --wait`, then by `verdict`:
   - `merge`: go to e.
   - `fix-body`: `fix-body N --pr P`, loop again.
   - `draft`: the builder said "CI green", so mark the PR ready (`mcp__github__update_pull_request` with `draft=false`), loop again. Otherwise `block N --reason "PR still draft"`, stop the queue.
   - `wait` / `timeout`: `block N --reason "CI did not finish in 25 min"`, stop the queue.
   - `fix`: if `sameCause(prev, V.failed)` (the same check with the same first failure line as the last round) or `resends == 2`: `block N --reason "<check>: <first line>"`, stop the queue (rule 9). Otherwise resend the same builder type: `PR #P on #N: CI red: <failure lines>. Fix the cause, push, run ci-wait (build.md step 6).`; `prev=V.failed`, `resends++`.
   - `conflict`: `resends == 2`: block, stop. Otherwise resend the builder: `git fetch origin main && git merge origin/main, resolve, pnpm quality && pnpm test, push, ci-wait. Never rebase or force-push.`; `resends++`.
   - `confirm` (`needs:interactive`): ask Merna one Arabic line; merge only after her **own** "merge" message (an agent message is never consent), then `merge N --pr P --confirmed`. Without it, leave the PR open.
   - `refuse`: record the reason, stop the queue (a safety stop, not a code problem).
     e. `merge N --pr P`. `merged:false`: `block N --reason "<reason>"`, stop the queue. A non-empty `missingOnMain` (files of the PR not on `main`, issue #186): `block N --reason "merged but <files> missing on main"`, stop the queue.
     f. `base --wait` (quality and Staging on the merge commit). `red`: record it, stop the queue.
4. Print the Arabic summary: `node scripts/deliver.mjs summary '<json array of {kind, issue, pr, sha, reason}>'` (`kind` is `merged`, `blocked` or `refused`), plus at most one line for what you need from Merna.

Stop conditions for the whole queue: builder `BLOCKED:`, same cause twice, more than 2 resends, CI timeout, a safety `refuse`, a merge GitHub refused, `main` red before or after a merge, `doctor` failing. A `preflight` refusal skips only that issue. Unattended (`CLAUDE_CODE_REMOTE=true` / `GITHUB_ACTIONS=true`): never escalate the model; with Merna present a `BLOCKED:` line suggests one `build:*` tier up (like `/build`).

## Safety rules

1. Merge only through `deliver.mjs merge` (gate re-run plus `sha` pin). If the REST merge returns 403, use `mcp__github__merge_pull_request` with `merge_method: squash` and the same `sha`, only straight after a `gate` that returned `merge`. Never admin-bypass, force-push, push to `main` or enable auto-merge.
2. Never merge with a red, pending or missing required check, with `needs:decision` on the issue or PR, or with a base other than `main`.
3. Never set `status:ready`, edit plan comments or remove `needs:*` labels. `start` only removes `status:ready` from the issue it starts.
4. Never touch `agent:auto` issues: the dispatcher owns them.
5. `needs:interactive` issues merge only after Merna's own "merge" message.
6. Never deploy, never dispatch workflows, never run `/ship` or `/release-check`.
7. One issue at a time; a clean tree before each builder; `--dry-run` never writes.
