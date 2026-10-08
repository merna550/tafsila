# Plan 58: deny production commands to agents

- Add `permissions.deny` to `.claude/settings.json` for `gh workflow run` on deploy/production workflows, `gh release create`, and `vercel` with `--prod`, `promote` or `rollback`.
- Tutorial: `AGENT_GITHUB_TOKEN` must have Actions = No access.
- Test: `scripts/workflows.test.mjs` checks every rule is present.
- `staging.yml` runs in GitHub Actions, not an agent session, so it is unaffected.
