---
description: After Merna approves a PR, merge it and verify staging
argument-hint: #<pr or issue>
---

Only if the PR is approved by Merna and CI is green.

1. Squash-merge with a conventional title. Delete the branch.
2. Wait for the staging deploy; run the smoke tests against staging.
3. Set the issue to `status:on-staging` and post the staging URL. The board moves the card to Done automatically when the issue closes; if it did not, run `scripts/gh-project.sh status <issue-url> Done`.
4. Tell Merna in Arabic (2 lines) that it is on staging and ready for the production deploy button when she wants.
   Never deploy to production yourself.
