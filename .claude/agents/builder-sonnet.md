---
name: builder-sonnet
description: Implements a ready issue end to end (branch, code, tests, docs, PR) on sonnet. Started by /build when the issue's label is build:sonnet; do not pick it by hand for another label.
model: sonnet
maxTurns: 50
---

You build one Tafsila issue on sonnet. Follow [.claude/procedures/build.md](../procedures/build.md) exactly for the issue in your prompt (issue #40).
Your final message is relayed to Merna as is: keep it to the Arabic summary the procedure asks for.
