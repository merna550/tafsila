---
packages: []
level: beginner
adr: ADR-008
---

# GitHub (Actions, Projects, labels, `gh` CLI)

**In one line:** Code, CI, issues, the board and labels in one place that agents drive through the `gh` command.

## What it is (plain words)

GitHub hosts the repo and pull requests. Actions runs automated checks. Projects is the Kanban board. Labels classify issues. The `gh` command-line tool lets scripts and agents do all of this without a browser.

## Why we chose it

- **One home for everything:** the issue is the spec, the PR is the change, Actions is the test run, the board is the status ([WORKFLOW](../../WORKFLOW.md)).
- **Agent friendly.** Agents create issues, move cards, tick acceptance criteria and open PRs with `gh` and the scripts in `scripts/` (`gh-project.sh`, `gh-ac.sh`).
- **Labels carry the process:** one status label, one model label, size, type, priority and area ([labels](../../WORKFLOW.md)); a workflow keeps the status label in sync with PRs.
- **Free for our size,** and GHCR hosts our images ([docker](docker.md)).

## Alternatives we considered (and why not)

- **Jira or Linear plus separate CI:** more tools to connect and pay for; agents drive them less easily.

## When we would change it

If the team grows to need a heavier planning tool. The labels and scripts would then be adapted, not the code.

## Where it lives in our code

- `.github/workflows/` (`quality.yml`, `docker.yml`, `status-labels.yml`), `.github/labels.yml`, `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/`.
- `scripts/gh-project.sh`, `scripts/gh-ac.sh`, `scripts/setup-labels.sh`.
- Slash commands: `.claude/commands/` ([claude-code](claude-code.md)).

## The 20% you need

- `Closes #N` in a PR body closes the issue on merge.
- Never commit or push to `main`; branch, PR, review ([CLAUDE.md](../../../CLAUDE.md) rule 1).
- Tick acceptance criteria as they are verified: `scripts/gh-ac.sh check <issue> <n>`.

## Commands you'll use

```bash
gh issue view 9
gh pr create --base main --title "..." --body-file pr.md
scripts/gh-ac.sh progress 9
scripts/gh-project.sh status <url> "In review"
```

## Common mistakes

- Opening a PR without `Closes #N` or a milestone.
- Forgetting to update the status label (the board column follows it).

## Learn more

- [GitHub Actions docs](https://docs.github.com/en/actions), [GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects), [`gh` manual](https://cli.github.com/manual/)
- Glossary: [GitHub Actions](../glossary.md#github-actions), [CI/CD](../glossary.md#ci-cd), [pull request](../glossary.md#pull-request), [status label](../glossary.md#status-label), [board](../glossary.md#board)
