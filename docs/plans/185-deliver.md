## Plan: `/deliver #N`, from an approved plan to a merged PR

### Facts this plan is built on (checked 2026-10-18)

- `main` has **no branch protection and no ruleset** (`GET branches/main/protection` → 404, `rulesets` → `[]`). The repo is **public**, so protection is free (ADR-022 is respected).
- Repo settings: `allow_auto_merge: false`, `delete_branch_on_merge: false`, squash allowed.
- Check runs on a PR head (PR #202) include our CI jobs (`quality`, `storybook`, `build`, `lint`, `e2e`, `db-reset`, `lychee`, `scope-*`) **and** helper jobs (`move`, `sync`), plus the Vercel commit status. Skipped jobs mean "no relevant change" and count as passed (ADR-86, #188).
- `scripts/ci-wait.mjs` (#178, on `main`) already waits for all checks on the head, prints failure lines, reports `mergeable_state`; `build.md` step 6 already runs it with at most 3 fix rounds.
- `status:*` labels are **not** exclusive until a PR opens (`status-labels.yml` only runs on PR events): `build.md` adds `status:in-progress` without removing `status:ready`, so the dispatcher can see an issue as `ready` while it is being built. This issue fixes that.
- `dispatch.mjs` builds only `agent:auto` issues; it counts `status:in-progress` issues for the parallel limit and the area lock, but does not exclude them (nor issues with an open PR) from the candidates.
- #186 (open) owns the `Closes #N` rule and the `pr-link.yml` workflow; until it lands, `/deliver` checks `base.ref == main` and the closing keyword itself. #188 (open) may change which checks run; the required-check list lives in one constant so #188 only edits one line.

### Approach

The main session is a **router with a merge gate**; all GitHub decisions are pure functions in `scripts/deliver.mjs` (unit-tested), all I/O goes through one small injectable GitHub REST client (`gh api` only, no GraphQL), so the whole flow runs against a fake client in tests and in `--dry-run`.

Session shape: the main session runs `/deliver`, calls `node scripts/deliver.mjs <cmd>` (REST), starts `builder-<model>` subagents in the foreground for code work, and merges only through `deliver.mjs merge`, which re-runs the gate and merges with the head SHA pinned. It builds **one issue at a time** (the subagents share the checkout).

#### Merge mechanism (decision D1)

**Direct squash merge by `deliver.mjs merge` after its own gate, with `sha` pinned. Auto-merge is not used.** Reasons: auto-merge is off at repo level and needs protection to mean anything; it would merge after the session ends, skipping the post-merge base check; and it knows nothing about our extra conditions (closing keyword, `needs:decision`, Vercel status, unticked criteria). Branch protection is recommended as a **second guard** (checklist below); the gate works with or without it (with protection, `mergeable_state: blocked` reads as "wait"). Fallback: if the REST merge returns 403 (token scope), the main session uses `mcp__github__merge_pull_request` with the same `sha` and `merge_method: squash`, only straight after a `gate` that returned `merge`.

#### `scripts/deliver.mjs` commands (all print one JSON line; `--dry-run` never writes and prints `would: <write>` lines; `--fixture <file.json>` swaps in the fake client)

| Command                          | Does                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `doctor`                         | `gh` present, `gh api repos/{repo}` works, git tree clean, on a branch that is not `main`. Fails → stop with the reason.                                                                                                                                                                                                                                                                                                       |
| `queue <#N…>` / `queue next [k]` | Reads the issues, runs `preflight` on each, orders by dependencies (see below). `next`: up to `k` (default 1) open `status:ready` issues that pass preflight. Prints `[{issue, action, reason, agent}]`.                                                                                                                                                                                                                       |
| `preflight <N>`                  | `action`: `build`, `resume` (an open PR for N exists) or `refuse` with a one-line reason.                                                                                                                                                                                                                                                                                                                                      |
| `start <N>`                      | Adds `status:in-progress`, removes `status:ready` (REST label endpoints). Never sets `status:ready`.                                                                                                                                                                                                                                                                                                                           |
| `find-pr <N>`                    | The open PR for N (see `findIssuePr`).                                                                                                                                                                                                                                                                                                                                                                                         |
| `gate <N> --pr <P> [--wait]`     | Verdict JSON `{verdict, reason, pr, sha, failed[]}`. `--wait` polls like `ci-wait` (20 s, 25 min) until the verdict is not `wait`; timeout → `timeout`.                                                                                                                                                                                                                                                                        |
| `fix-body <N> --pr <P>`          | Adds `Closes #N` as the first body line (REST PATCH), only when it is missing. (Removed once #186's workflow does this.)                                                                                                                                                                                                                                                                                                       |
| `merge <N> --pr <P>`             | Re-runs the gate; only on `merge`: `PUT pulls/P/merge {merge_method: "squash", sha, commit_title: "<PR title> (#P)"}`. 405/409 (head moved, not mergeable) → `{merged:false, reason}`, never retried blindly. After merge: polls the issue up to 60 s; if still open, closes it (`state_reason: completed`) with a comment "Closed by /deliver: PR #P merged"; deletes the head branch when it is in this repo and not `main`. |
| `base [--wait]`                  | Verdict for `main`: reads check runs of the `main` HEAD and the latest `Staging` workflow run for that SHA. `green` / `pending` / `red` with names.                                                                                                                                                                                                                                                                            |
| `block <N> --reason "<line>"`    | Comments the reason on the issue and sets `status:blocked` (removing other `status:*`).                                                                                                                                                                                                                                                                                                                                        |

#### Pure decision functions (exported, unit-tested)

- `preflightVerdict(issue, openPrs)`, in this order:
  1. closed → `refuse` "closed".
  2. `agent:auto` → `refuse` "owned by the dispatcher (agent:auto)" (ownership rule, D3).
  3. `needs:decision` → `refuse` "needs:decision is open".
  4. own open PR found → `resume` (any status except `status:blocked`, which refuses "blocked: <see issue>").
  5. `status:in-progress` without a PR → `refuse` "already being built by another session".
  6. not `status:ready` → `refuse` "not status:ready (<current status>)". `/deliver` never approves.
  7. else `build`, `agent` from `resolveModel("build", labels)` (agent-model.mjs, no copy).
- `orderQueue(issues, closedNumbers)`: topological by `parseDependencies` (imported from `dispatch.mjs`); an issue whose dependency is open and not earlier in the queue → `refuse` "depends on #X (open)"; ties by `byPriority` (exported from `dispatch.mjs`, not copied).
- `findIssuePr(number, prs)` in new `scripts/issue-link.mjs` (shared with `dispatch.mjs`; #186 reuses it): an open PR whose body has a closing keyword `(close[sd]?|fix(e[sd])?|resolve[sd]?) #N\b`, or whose head branch matches `^(feat|fix|chore|test|spike|docs)/N-`. A plain `#N` mention or `Part of #N` never matches (the #134 / PR #151 case).
- `classifyChecks(checks)`: **extracted from `ci-wait.mjs`** (`completedFailures` + `GREEN_CONCLUSIONS`) and exported; `ci-wait` and `deliver` both use it → `{state: pending|green|red, failed[]}`.
- `gateVerdict({issue, pr, checks, statuses, criteria})`, first match wins:

| #   | Condition                                                                                                                                     | Verdict                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | PR merged/closed                                                                                                                              | `refuse` "PR closed"                              |
| 2   | `pr.base.ref !== "main"` or head repo is a fork                                                                                               | `refuse` "base is <ref>, not main"                |
| 3   | `needs:decision` on the issue or the PR                                                                                                       | `refuse` "needs:decision"                         |
| 4   | body has no closing keyword for N                                                                                                             | `fix-body`                                        |
| 5   | `pr.draft`                                                                                                                                    | `draft`                                           |
| 6   | any check run not completed, a `REQUIRED_CHECKS` name missing, commit status `pending`, or `mergeable` is `null` / `mergeable_state: unknown` | `wait`                                            |
| 7   | any check run red (not success/neutral/skipped) or a commit status `failure`/`error` (Vercel)                                                 | `fix` with `failed[]`                             |
| 8   | `mergeable_state: dirty` (conflict)                                                                                                           | `conflict`                                        |
| 9   | `mergeable_state: blocked` (protection waiting)                                                                                               | `wait`                                            |
| 10  | unticked criteria (`gh-ac` progress < N/N) and the PR body has no `## Unticked criteria` section with a line per unticked item                | `refuse` "criteria x/y, unticked not explained"   |
| 11  | issue has `needs:interactive`                                                                                                                 | `confirm` (Merna says "merge" in her own message) |
| 12  | otherwise (`clean`, `behind`, `unstable` with all checks green, `has_hooks`)                                                                  | `merge`                                           |

`REQUIRED_CHECKS = ["quality", "build", "e2e", "db-reset", "storybook"]` (one exported constant; the Merna checklist and #188 reference it).

- `sameCause(prevFailed, failed)`: true when the sets of failed check names overlap and the first failure line of a shared check is equal (rule 9).
- `baseVerdict(checks, stagingRun)`: red when any `REQUIRED_CHECKS` run on the `main` HEAD is red or the `Staging` run for that SHA failed.
- `summaryLine(result)`: the Arabic line per issue (format below).
- Criteria are read with the same awk rules as `scripts/gh-ac.sh`: call `scripts/gh-ac.sh progress <N>` and parse `x/y` (no second parser).

#### `/deliver` algorithm (`.claude/commands/deliver.md`, run by the main session)

```
0. node scripts/deliver.mjs doctor                       → fail: one Arabic line, stop.
1. Q = node scripts/deliver.mjs queue $ARGUMENTS          → print refused lines; Q empty: stop.
2. node scripts/deliver.mjs base --wait                   → red: stop "main is red (<names>)".
3. for each issue N in Q (strictly one at a time):
   a. P = preflight N (again: state may have changed).   refuse → line, continue with next.
   b. build:  start N; run <agent> in the FOREGROUND with:
        "Build issue #N following .claude/procedures/build.md. Delivered by /deliver:
         branch <type>/N-<slug> from origin/main (not the session branch), do not merge."
      resume: skip the builder.
      Summary ends with BLOCKED: → record, STOP the queue.
   c. PR = find-pr N.  none → block N "builder ended without a PR"; STOP.
   d. resends = 0; prev = []
      loop:
        V = gate N --pr PR --wait
        merge    → go to e.
        fix-body → fix-body N --pr PR; continue.
        draft    → builder said "CI green": mcp update_pull_request draft=false; continue.
                   else block N "PR still draft"; STOP.
        wait / timeout → block N "CI did not finish in 25 min"; STOP.
        fix      → sameCause(prev, V.failed) or resends == 2 → block N "<check>: <first line>"; STOP.
                   else resend builder (same type): "PR #PR on #N: CI red: <failure lines>.
                   Fix the cause, push, run ci-wait (build.md step 6)."; prev = V.failed; resends++.
        conflict → resends == 2 → block; STOP. else resend builder: "git fetch origin main &&
                   git merge origin/main, resolve, pnpm quality && pnpm test, push, ci-wait.
                   Never rebase or force-push."; resends++.
        confirm  → ask Merna one Arabic line; merge only on her own "merge" reply; else leave it.
        refuse   → record reason; STOP (a safety stop, not a code problem).
   e. M = merge N --pr PR → merged:false → block N with reason; STOP.
   f. base --wait (quality + Staging on the merge commit) → red: record, STOP the queue.
4. Print the Arabic summary.
```

Stop conditions (whole queue): builder `BLOCKED:`; same cause twice (rule 9); more than 2 resends; CI timeout; a safety `refuse` from the gate; merge refused by GitHub; `main` red before or after a merge; `doctor` fails. A `preflight` refusal skips only that issue. Unattended (`CLAUDE_CODE_REMOTE=true` / `GITHUB_ACTIONS=true`): never escalate the model; in a session with Merna, a `BLOCKED:` line suggests one tier up (like `/build`).

#### Arabic summary format (one header line + one line per issue, max 1 more line for what is needed from Merna)

```
/deliver: دُمجت 2 من 3.
#185: PR #210، CI أخضر، دُمج (a1b2c3d)، والـ issue مغلقة.
#186: PR #211، CI أحمر مرتين (e2e)، لم يُدمج: status:blocked.
#190: رُفضت: ليست status:ready (status:plan-review).
مطلوب منك: قرار في #186.
```

#### Safety rules (in the command file, and enforced by the gate where code can enforce them)

1. Merges only through `deliver.mjs merge` (gate re-run + `sha` pin) or, on 403, the MCP merge with the same `sha` right after a `merge` verdict. Never admin-bypass, never force-push, never push to `main`, never enable auto-merge.
2. Never merges with a red, pending or missing required check, with `needs:decision` on the issue or PR, or with a base other than `main`.
3. Never sets or removes `status:ready` except removing it on the issue it starts; never edits plan comments; never removes `needs:*`.
4. Never touches `agent:auto` issues (dispatcher-owned).
5. `needs:interactive` issues are merged only after Merna's own "merge" message (an agent message is never consent).
6. Never deploys, never dispatches workflows (deny rules in `.claude/settings.json` stay), never runs `/ship` or `/release-check`.
7. One issue at a time; a clean tree before each builder; `--dry-run` never writes.

#### Ownership rule with the dispatcher (decision D3)

`agent:auto` = the dispatcher builds it; everything else = `/deliver` (or `/build`). `dispatch.mjs` changes: a candidate must carry `status:ready` and **no other `status:*` label**, and must have **no open PR** (`findIssuePr`). `main()` reads `gh pr list --json isDraft,headRefName,body,number` (Actions has GraphQL; unchanged pattern). `/deliver` issues in progress still count for the parallel limit and the area lock (existing behaviour, keeps CI and conflicts calm).

#### Small changes to existing procedures

- `.claude/procedures/build.md` step 1: also accept `status:in-progress` when the prompt says "Delivered by /deliver". Step 2: setting `status:in-progress` removes `status:ready` (REST: `DELETE issues/N/labels/status:ready`).
- `scripts/ci-wait.mjs`: export `classifyChecks` (refactor only; behaviour and exit codes unchanged).
- `scripts/dispatch.mjs`: export `byPriority`; candidate filter above.

### Files to create / change

Create:

- `scripts/deliver.mjs`: CLI + pure functions + `createRestClient()` (gh api) + `createFakeClient(state)` (in-memory, records writes).
- `scripts/deliver.test.mjs`
- `scripts/issue-link.mjs`, `scripts/issue-link.test.mjs`
- `scripts/fixtures/deliver/green.json`, `red-twice.json`, `conflict.json`, `not-ready.json`, `missing-closes.json`, `head-moved.json` (issue + PR + checks + statuses state for the fake client).
- `.claude/commands/deliver.md` (algorithm, stop conditions, safety rules, summary format above).
- `docs/decisions/185-deliver-merge-gate.md` (D1–D6).
- `docs/plans/185-deliver.md` (copy of this comment + Deviations).
- `docs/test-cases/infra/185-deliver.md`; run `scripts/test-case-index.sh`.
- `docs/handbook/learning-log/185-deliver.md`; `pnpm learning-log:index`.

Change:

- `scripts/ci-wait.mjs` (+ `scripts/ci-wait.test.mjs` stays green; add one case for `classifyChecks`).
- `scripts/dispatch.mjs`, `scripts/dispatch.test.mjs`.
- `.claude/procedures/build.md` (steps 1 and 2 only).
- `docs/WORKFLOW.md`: §1 lifecycle diagram (`status:ready ─► /deliver ─► in-progress ─► PR ─► gate ─► merge ─► on-staging`, next to the `/build` path), the step table row, §2 ownership rule, a "Repository settings for /deliver" checklist, §3 note that `/deliver` and `/build` keep exactly one status label.
- `docs/CONTEXT_MAP.md`: add `scripts/deliver.mjs`, `scripts/issue-link.mjs`, `.claude/commands/deliver.md` to the "Agent tooling" row.
- `CLAUDE.md`: add `/deliver` to the saved-prompts list in "Where to look" (no status change).

No data, schema, migration, API or OpenAPI/Postman changes. No new dependency.

### Repository settings checklist for Merna (goes into WORKFLOW.md; optional second guard, `/deliver` works without them)

1. Settings → Branches → Add rule for `main`: "Require a pull request before merging" (0 approvals), "Require status checks to pass": `quality`, `build`, `e2e`, `db-reset`, `storybook` (do **not** tick "Require branches to be up to date"), "Do not allow bypassing the above settings", block force pushes and deletion.
2. Settings → General → Pull Requests: keep "Allow squash merging" on, turn on "Automatically delete head branches", leave "Allow auto-merge" off.
3. Nothing paid; the repo is public, so branch protection is on GitHub Free.

### Test plan (no real merges needed)

Unit, `scripts/deliver.test.mjs` (vitest, `pnpm test:docs`):

- `preflightVerdict`: `status:ready` → `build` with `builder-sonnet` for `build:sonnet`; `status:plan-review` → refuse "not status:ready (status:plan-review)"; `needs:decision` → refuse; `agent:auto` → refuse "owned by the dispatcher"; closed → refuse; `status:in-progress` + own open PR → `resume`; `status:in-progress` without PR → refuse "already being built"; `status:blocked` + PR → refuse.
- `orderQueue`: `[#3 depends on #2, #2]` → `[#2, #3]`; `#3 depends on #9 (open, not in queue)` → refuse "depends on #9 (open)"; P0 before P1 with no deps; `next` skips `agent:auto`, `needs:decision`, non-ready.
- `gateVerdict` table: one test per row 1–12, plus: all required checks `skipped` → `merge`; `build` present twice (dispatch + docker) one skipped one success → `merge`; Vercel status `failure` → `fix` `["Vercel"]`; `mergeable: null` → `wait`; `behind` → `merge`; required `db-reset` missing → `wait`; `Part of #185` only → `fix-body`; base `develop` → refuse.
- `sameCause`: same check + same first line → true; same check, different line → false; disjoint → false.
- `baseVerdict`: green; `quality` red on HEAD → red `["quality"]`; Staging failed → red `["Staging"]`; pending → pending.
- `summaryLine`: merged, blocked, refused lines match the format exactly (Arabic strings as fixtures).
- Fake-client flows: `merge` on `green.json` records exactly one `PUT pulls/P/merge` with the head `sha`; `head-moved.json` (409) → `merged:false`, no retry; `--dry-run` records zero writes and prints `would: PUT …`; issue still open after merge → one close write + comment; `start` on a ready issue → add `status:in-progress`, remove `status:ready`, nothing else.
- CLI smoke (spawn): `node scripts/deliver.mjs gate 999 --pr 1 --fixture scripts/fixtures/deliver/red-twice.json` prints `{"verdict":"fix",…}` and exits 0; unknown command exits 2 with usage.

Unit, `scripts/issue-link.test.mjs`: `Closes #185` matches 185; `closes #185.` matches; `#1850` does not; `Part of #185` does not; plain `see #185` does not; branch `chore/185-deliver` matches; `chore/1850-x` does not; closed PR ignored.

Unit, `scripts/dispatch.test.mjs`: issue with `status:ready` + `status:in-progress` and `agent:auto` is not picked; `agent:auto` ready issue with an open PR (`Closes #N`) is skipped and the next one is picked; a PR that only mentions `#134` (body of PR #151) does not skip #134.

Unit, `scripts/ci-wait.test.mjs`: `classifyChecks` pending / green / red; existing exit-code tests unchanged.

Manual test cases (`docs/test-cases/infra/185-deliver.md`):

- TC-INF-185-01 `/deliver #N` on a small docs-only test issue (`plan:none`, `build:haiku`, `status:ready`) ends with a merged PR, closed issue, deleted branch, Arabic line "دُمج". (Acceptance 1; the only real merge, run once after this PR lands.)
- TC-INF-185-02 `/deliver #N` on a `status:plan-review` issue refuses in one line, no label change.
- TC-INF-185-03 `/deliver --dry-run #N` against `red-twice.json`: second red with the same cause → `would: block`, `status:blocked` line in the summary. (Acceptance 3.)
- TC-INF-185-04 While `/deliver` builds #N (labels `status:in-progress`, no `status:ready`), run Dispatch agent with `dry_run: true`: it does not print `issue=#N`. (Acceptance 4.)
- TC-INF-185-05 `/deliver #N` on an `agent:auto` issue refuses "owned by the dispatcher".
- TC-INF-185-06 `main` red (simulate with the fixture `base` red) → queue stops before building.

### Docs to update

`docs/WORKFLOW.md` (diagram, table, ownership rule, settings checklist), `docs/CONTEXT_MAP.md`, `CLAUDE.md` saved prompts, decision file, plan file, test cases + index, learning-log + index. SRS: none (process).

### Decisions (the build writes them as `docs/decisions/185-deliver-merge-gate.md`)

- **D1 Merge mechanism:** direct squash merge by `deliver.mjs merge` after its own gate, head `sha` pinned; auto-merge not used; branch protection recommended as a second guard, not a dependency.
- **D2 Required checks:** `quality`, `build`, `e2e`, `db-reset`, `storybook` must be present and green or skipped on the head; every other check run and the Vercel status must not be red. One constant `REQUIRED_CHECKS`.
- **D3 Ownership:** `agent:auto` = dispatcher only; `/deliver` refuses it. The dispatcher skips issues with any `status:*` besides `ready` or with an open PR (matched by `Closes #N` or branch name, never a plain mention).
- **D4 Fix budget:** the builder keeps its own 3 CI rounds (build.md); `/deliver` adds at most 2 resends (red or conflict) per issue; the same cause twice → `status:blocked` (rule 9). Conflicts are fixed by merging `origin/main`, never by rebase or force-push.
- **D5 Queue:** strictly sequential; dependency order, then priority, then number; a single-issue refusal skips it, any blocked/safety/base stop ends the queue; after each merge the queue waits for `quality` and `Staging` on the merge commit.
- **D6 Criteria and Claude config:** merge needs `gh-ac` N/N or a `## Unticked criteria` section explaining each one; `needs:interactive` issues merge only after Merna's own "merge" message.

### Risks

- **Merging something red** → gate re-run inside `merge`, `sha` pin (a push after the gate makes GitHub refuse with 409), unit test per gate row, `--dry-run` + fixtures before the first real run.
- **Same checkout for several builders** → `doctor` requires a clean tree; each builder branches from `origin/main`; strictly sequential.
- **Cloud sessions pin a session branch** → the prompt tells the builder to use `<type>/N-<slug>`; branch pushes per issue already work in cloud sessions (e.g. `chore/184-sew-test-issues`).
- **Check name clash** (`build` from `dispatch.yml` and `docker.yml`) → presence is enough; any red run with that name blocks.
- **#186 / #188 overlap** → `issue-link.mjs` is the shared matcher #186 should reuse (the build adds a one-line comment on #186); `REQUIRED_CHECKS` is the one line #188 may change; whichever PR lands second merges `origin/main`.
- **Long waits in the main session** → waiting happens inside `deliver.mjs --wait` (one tool call, few tokens), not in model turns.

### Size and labels

- Size **M** stays (one script + tests, one command, small edits in 3 existing scripts/procedures, docs).
- `build:opus` → **`build:sonnet`**: WORKFLOW rubric ("architecture / touches 3+ areas → build:sonnet") and this plan fixes every rule and test; the risky part is pure functions with table tests.
- `node scripts/needs-interactive.mjs <files above>` → **yes** (`.claude/commands/deliver.md`, `.claude/procedures/build.md`): label `needs:interactive` added. The dispatcher never builds it; build it in a session with Merna (as planned now).
- No `needs:decision`: every choice above is cheap to reverse.

---

_Generated by [Claude Code](https://claude.ai/code)_
