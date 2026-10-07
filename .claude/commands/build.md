---
description: Implement a ready issue from its plan (model picked from its build:* label)
argument-hint: #<issue>
---

Issue: $ARGUMENTS. You only route the work; a subagent on the label's model does it (issue #40, ADR-019).

1. Resolve the model: `node scripts/agent-model.mjs build <N>`. It prints `{"issue","model","agent","note"}`.
   If `gh` is unavailable, read the issue labels with the GitHub MCP tools and apply the same rule: `build:haiku|sonnet|opus` → `builder-<model>`; missing or unknown → `builder-sonnet` with a note.
2. If `note` is not empty, tell Merna in one Arabic line (for example: no `build:*` label, building with sonnet).
3. Start the `agent` subagent with the prompt: `Build issue #<N> following .claude/procedures/build.md.` plus anything Merna added after the issue number. Do not read the issue, the plan or code yourself.
4. Relay the subagent's final summary to Merna unchanged.
   - If the Stop hook reports failing checks, send those failures back to the same subagent (or a new one of the same type) to fix; do not fix them yourself.
   - Interactive session with Merna and the summary ends with `BLOCKED:` → suggest escalating the `build:*` label one tier. Unattended (`GITHUB_ACTIONS=true` or `CLAUDE_CODE_REMOTE=true`) → never escalate.
