# ADR-181 · 2026-10-18 · Token diet for sessions and subagents

## Context

Every session re-reads `CLAUDE.md`, the nested notes, `docs/CONTEXT_MAP.md` and `.claude/rules/**`. Prettier pads markdown tables, so one row could exceed 300 characters. The skills list from unused plugins is injected on every turn. Builders hit the 50-turn limit.

## Decision

- Tables in `CLAUDE.md`, `docs/CONTEXT_MAP.md` and `.claude/rules/frontend/*` become bullet lists (same facts, no padding). Long reference tables stay in `docs/`, which is not auto-loaded.
- `.claude/settings.json` should disable the plugins this project never uses: `document-skills` and `example-skills` (from `anthropic-agent-skills`). NOT APPLIED in this PR: the agent run was not allowed to edit `.claude/settings.json`; Merna applies it by hand. The repo has no MCP servers and no project plugins.
- `maxTurns`: `builder-opus` 120, `builder-sonnet` 80, `builder-haiku` 50; planners unchanged. Builders stop at a milestone boundary, not mid-edit.
- `build.md` and `plan.md` should forbid printing a whole CI or test log. NOT APPLIED in this PR (sensitive files); Merna applies it by hand.

## Reason

Fewer tokens on every turn and fewer resume messages, with no change to the facts agents read.

## Alternatives

Splitting files further: rejected, more reads per task. Skills still listed by user-level settings outside this repo cannot be changed here (out of scope: the harness).

## Measurement

`node scripts/agent-usage.mjs` needs a usage file that is not available in this run, so the first-turn token count could not be measured. Proxy: bytes of the auto-loaded files (see the PR for before and after).
