---
description: Short project status from the board
---

Using `gh` and the project board, report in Arabic, max 10 lines:

- In review (needs Merna), blocked / needs:decision (with the question), in progress with `x/y criteria` from `scripts/gh-ac.sh progress <issue>`, next 3 ready issues by priority with their build model.
- Open/closed issue count per milestone (`gh api 'repos/{owner}/{repo}/milestones?state=open' --jq '.[] | "\(.title): \(.closed_issues) closed / \(.open_issues) open"'`), current milestone first. Staging vs production version.
  Update the "Current status" section of CLAUDE.md if it is out of date.
