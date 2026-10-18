# Plan: plans live on the issue only (#179)

`plan:none`: the issue body is the plan.

Scope: `/plan` and `/plan-wave` post the plan comment only (no plan file, branch or PR); the build copies the approved comment to `docs/plans/<N>-<slug>.md` in its own PR with a "Deviations" section; approval is the label `status:ready`; `docs/WORKFLOW.md` describes the flow.

## Deviations

- The `Approve plan` row in WORKFLOW §1 now names the label instead of a comment.
- Added a guard test in `scripts/workflows.test.mjs` (no plan PR or plan branch wording).
- No script reads `docs/plans/`, so none changed.
