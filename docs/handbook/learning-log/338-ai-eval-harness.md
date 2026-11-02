---
date: "2026-11-02"
issue: "#338"
title: "AI evaluation harness"
---

`pnpm ai:eval` scores a provider and model on labelled photos so the provider choice is a number. The scoring rules are pure functions written and tested before any real run: micro accuracy over the features that apply to the category, "absent in both" not counted, pockets as a set, a confusion list of the most common wrong answers, and a check of how many mistakes the low-confidence flag catches. Latency uses nearest-rank percentiles (p50, p95) and cost is shown in USD and EGP; a budget flag stops before the spend passes the cap. CI runs it with the fake provider on three sample labels.

Read: [Accuracy](../glossary.md#accuracy), [Percentile](../glossary.md#percentile), [Confusion list](../glossary.md#confusion-list), [AI package](../../backend/ai.md#evaluation), [decision 338](../../decisions/338-ai-eval-harness.md)
