---
description: After Merna approves a PR, merge it and verify staging
argument-hint: #<pr or issue>
---

Only if the PR is approved by Merna, CI is green, and `scripts/gh-ac.sh progress <issue>` is N/N (or the PR body explains every unticked criterion and Merna accepted it).

1. Squash-merge with a conventional title. Delete the branch.
2. Wait for the staging deploy; run the smoke tests against staging.
3. Set the issue to `status:on-staging` and post the staging URL. `board-sync.yml` moves the card to Done when the issue closes.
4. Tell Merna in Arabic (2 lines) that it is on staging and ready for the production deploy button when she wants.
   Never deploy to production yourself.
