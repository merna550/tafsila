---
description: Write the implementation plan for an issue (use the model in its plan:* label)
argument-hint: #<issue>
---

Follow docs/WORKFLOW.md. Issue: $ARGUMENTS

1. Read the issue, CLAUDE.md, the linked SRS sections, and DECISIONS.md entries for the same areas. Read only the code files you need: start from the matching row of `docs/CONTEXT_MAP.md` and use the `code-search` subagent instead of opening many files.
2. Post ONE plan comment on the issue:
   - Approach (short), files to create/change (the build reads only these and its `docs/CONTEXT_MAP.md` row), data/schema/migration changes, API contract changes.
   - Test plan: unit / property / e2e / visual cases with concrete inputs, plus a draft list of manual test cases (IDs TC-<AREA>-<N>-xx).
   - Docs to update. Risks and how they are handled. Estimated size (adjust label if wrong).
   - Re-check build:* label; change it if the plan shows a different difficulty.
3. If the plan requires a costly or irreversible decision not in the docs, add `needs:decision` and ask ONE precise question in the comment; otherwise decide, and list the decision for DECISIONS.md.
4. Save the same plan to `docs/plans/<N>-<slug>.md` (committed with the build).
5. Set status: `status:plan-review` if plan:opus or size:L, else `status:ready`; move the board card to match:
   `scripts/gh-project.sh status <issue-url> Ready` (plan-review stays in Backlog until Merna approves).
6. Tell Merna in Arabic (max 4 lines) what is needed from her, if anything.
