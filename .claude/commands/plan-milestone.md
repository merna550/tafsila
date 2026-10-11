---
description: Write a milestone brief and draft its issues (Opus, once per milestone)
argument-hint: M<number>
---

Milestone: $ARGUMENTS. Use only with Opus, once per milestone, when the previous milestone is about 70% done (docs/WORKFLOW.md section 8). Decisions Merna already made are in docs/DECISIONS.md; do not ask them again.

1. Read SRS section 12 (the row for this milestone), the requirement IDs it lists in SRS section 4, the previous brief in `docs/milestones/`, and the decisions for the same areas (`docs/DECISIONS.md`, `docs/decisions/`). Check `gh issue list --milestone "<title>" --state all` so nothing is duplicated.
2. Write `docs/milestones/M<n>-<slug>.md` with: goal, in/out of scope, SRS IDs, deliverables, exit criteria, dependencies, Merna's tasks, risks, issue list with waves. Link it from `docs/milestones/README.md`.
3. Draft each issue with `gh issue create --milestone "<exact title>"` in the format of the existing issues: Goal, Scope, `## Acceptance criteria` checkboxes, SRS IDs, out of scope, dependencies ("Depends on #N"). Labels: `status:plan-review`, one each of type, priority, size, plan:_, build:_ (rubric in WORKFLOW section 2), area:*, plus `needs:sew-test` for new garment geometry. Move each card to Backlog with `scripts/gh-project.sh add <url> Backlog`.
4. Add the new issue numbers to the brief's issue list.
5. If a costly or irreversible decision is undocumented, add `needs:decision` to the brief's issue and ask ONE question; otherwise decide and log an ADR.
6. Reply to Merna in Arabic, max 5 lines: brief link, number of issues, decisions she must answer (if any). Next step: `/plan-wave`.
