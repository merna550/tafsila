---
description: Turn an idea or an existing issue into a fully labelled, ready-to-plan GitHub issue with a model recommendation
argument-hint: <idea text> | #<issue>
---

Follow docs/WORKFLOW.md. Input: $ARGUMENTS

1. Read CLAUDE.md and only the SRS sections relevant to the idea (search by keyword / requirement ID). Check open issues for duplicates (`gh issue list --search`).
2. Write or update the issue (English) with the matching template:
   - Problem / goal (2–4 lines), user story, acceptance criteria as checkboxes, SRS IDs (add new IDs if missing), out of scope.
3. Apply labels with `gh issue edit`: one each of status (`status:needs-plan`, or `status:ready` if `plan:none`), type, priority, size, plan:_, build:_; one or more area:*; flags if relevant (`needs:sew-test` for any new garment geometry).
4. Choose plan:* and build:* with the rubric in docs/WORKFLOW.md §2. If size is XL, split into child issues and link them.
5. Milestone: pick the one the work belongs to using docs/WORKFLOW.md §8 (milestone map) and pass it on creation
   (`gh issue create … --milestone "M2 - Engine core"`) or later (`gh issue edit N --milestone "…"`).
   If the work fits no milestone, leave it empty and say so in the reply.
6. Board: add the issue to the Tafsila project board with the column matching its status label:
   `scripts/gh-project.sh add <issue-url> Ready` for `status:ready`, `… Backlog` for `status:needs-plan` / `status:triage`.
7. Reply to Merna in Arabic, max 5 lines: issue link, labels, milestone, board column, recommended models and why (one line). Do not ask questions answered by the docs.
