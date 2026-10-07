---
packages: []
level: beginner
adr: ADR-008
---

# Claude Code

**In one line:** The AI coding agent that plans, builds, reviews and ships most of Tafsila through slash commands, with cheaper models for easier work.

## What it is (plain words)

Claude Code is a command-line agent that reads the repo, edits files, runs commands and uses `gh`. We guide it with `CLAUDE.md` files, path-scoped rules, task skills and saved prompts (slash commands).

## Why we chose it

- **A solo founder cannot write everything.** Agents follow a fixed lifecycle: `/triage`, `/plan`, `/build`, `/review`, `/ship` ([WORKFLOW section 1](../../WORKFLOW.md)).
- **Model labels keep cost low.** Plan once with a strong model, build with the cheapest model that can follow the plan ([WORKFLOW section 2](../../WORKFLOW.md)).
- **Quality is enforced mechanically,** not by hope: lint, tests, duplicate and architecture checks must pass before every commit ([eslint-prettier](eslint-prettier.md), [jscpd-dependency-cruiser](jscpd-dependency-cruiser.md)).
- **Per-area configuration** loads only the rules for the files being edited ([ADR-008](../../DECISIONS.md)).

## Alternatives we considered (and why not)

- **Manual development only:** too slow for one person.

## When we would change it

If another agent tool becomes clearly better or cheaper, the project docs (`CLAUDE.md`, `AGENTS.md`, `docs/`) and scripts remain usable by it; only `.claude/` is specific.

## Where it lives in our code

- `CLAUDE.md` (root), `apps/web/CLAUDE.md`, `packages/api/CLAUDE.md`, `packages/engine/CLAUDE.md`, `AGENTS.md`.
- `.claude/commands/`, `.claude/rules/`, `.claude/skills/`, `.claude/settings.json`.
- `.github/workflows/claude.yml`, `.github/workflows/dispatch.yml`, `scripts/dispatch.mjs`, `scripts/agent-setup.sh`.

## Running in the cloud

- **claude.ai/code** (web or phone), connected once with `/web-setup`; no GitHub App needed.
- **GitHub Action** `claude.yml` (`@claude` from Merna, or called by the dispatcher). Auth is the subscription token plus a fine-grained token, not an API key. Auto-fix on PRs needs the GitHub App, so it is not used.
- A **SessionStart hook** (`.claude/settings.json`) runs `scripts/agent-setup.sh`, which does nothing unless the session is a cloud one (`CLAUDE_CODE_REMOTE=true`). See [tutorial](../../backend/tutorials/run-agents-in-cloud.md) and [ADR-016](../../DECISIONS.md).

## The 20% you need

- Work starts from a GitHub issue with acceptance criteria; the agent never pushes to `main`.
- Docs answer questions: agents read [DECISIONS](../../DECISIONS.md) before asking.
- Merna talks to the agent in Arabic; code, commits and docs are English.

## Commands you'll use

`/triage`, `/plan`, `/build`, `/review`, `/ship`, `/status` ([commands](../../../.claude/commands/build.md)).

## Common mistakes

- Starting from an idea instead of an issue.
- Carrying one long chat across issues (start fresh per issue to save tokens).

## Learn more

- [Claude Code docs](https://docs.claude.com/en/docs/claude-code/overview) (official)
- Glossary: [skill](../glossary.md#skill-agent), [slash command](../glossary.md#slash-command), [CLAUDE.md](../glossary.md#claude-md), [triage](../glossary.md#triage)
