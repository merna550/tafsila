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
5. Add the issue to the project board and its milestone.
6. Reply to Merna in Arabic, max 5 lines: issue link, labels chosen, recommended models and why (one line). Do not ask questions answered by the docs.
