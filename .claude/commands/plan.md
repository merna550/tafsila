---
description: Write the implementation plan for an issue (model picked from its plan:* label)
argument-hint: #<issue>
---

Issue: $ARGUMENTS. You only route the work; a subagent on the label's model does it (issue #40, ADR-019).

1. Resolve the model: `node scripts/agent-model.mjs plan <N>`. It prints `{"issue","model","agent","note"}`.
   If `gh` is unavailable, read the issue labels with the GitHub MCP tools and apply the same rule: `plan:sonnet|opus` → `planner-<model>`; `plan:none` → no planner; missing or unknown → `planner-sonnet` with a note.
2. `plan:none` (`agent` is null): tell Merna in one Arabic line that the issue needs no plan and can go to `/build` once it is `status:ready`. Stop.
3. If `note` is not empty, tell Merna in one Arabic line (for example: no `plan:*` label, planning with sonnet).
4. Start the `agent` subagent with the prompt: `Plan issue #<N> following .claude/procedures/plan.md.` plus anything Merna added after the issue number. Do not read the issue or code yourself. Run it in the **foreground** (`run_in_background: false`) and wait for its final summary; never end your turn while it is still running: in headless runs (GitHub Actions) the run stops when your turn ends and cuts the subagent off (issue #48).
5. Relay the subagent's final summary to Merna unchanged.
