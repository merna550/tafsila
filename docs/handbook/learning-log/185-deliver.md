---
date: "2026-10-18"
issue: "#185"
title: "A merge gate in code, not in the prompt"
---

`/deliver` lets one command take an approved issue to a merged PR, but every merge decision is a tested function (`gateVerdict`) and the merge itself pins the head SHA, so a late push makes GitHub refuse instead of merging unchecked code. Ownership is explicit: `agent:auto` belongs to the dispatcher, everything else to `/deliver`.

Read: [Claude Code](../tech/claude-code.md)
