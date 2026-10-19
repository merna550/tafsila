---
date: "2026-10-19"
issue: "#238"
title: "One rule list for the design picker"
---

The engine now exposes what a design may contain: `specRefusals` is the single list of refused combinations (the same predicates the modules use), `specOptions` marks each value allowed or refused with an Arabic and English reason, `defaultSpec` gives a valid start per category and `normalizeSpec` repairs any design by changing the add-on that clashes. Tests and the future picker read the same list, so they can never disagree.

Read: [Engine README, picker rules](../../engine/README.md#picker-rules)
