---
description: Plan every needs-plan issue whose dependencies are closed, in one session (Opus, Merna present)
argument-hint: [M<number>]
---

Scope: $ARGUMENTS (default: the current milestone). Run with Opus while Merna is present. `/plan-milestone` splits a milestone into issues; `/plan-wave` plans the next wave of them.

1. Find candidates: open issues in the milestone with `status:needs-plan` or `status:plan-review` and no `needs:decision`. Keep an issue only when every "Depends on #N" in its body is closed. List the skipped ones with the open dependency.
2. For each candidate, follow `.claude/procedures/plan.md` steps 1 to 4 yourself in this session (no subagents, so you see overlaps between plans): post the plan comment only (no plan file, no git work), list decisions (the build writes each as `docs/decisions/<issue>-<slug>.md`). Do not set `status:ready` yet. `plan:none` issues are listed, not planned.
3. Make no git changes: no branch, no commit, no PR. Plans are comments on their issues.
4. Give Merna ONE short Arabic summary (max 10 lines): per issue its number, model and the decisions that need her eyes; then end with the plan comment links and ONE line listing the issue numbers to approve (set `status:ready`, or reply "approved" or "approved except #N").
5. After she replies: for each approved issue set `status:ready` and move the card (`scripts/gh-project.sh status <url> Ready`). For "except #N", leave it in `status:plan-review` and apply her comments. Never approve on her behalf.
