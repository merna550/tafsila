---
date: "2026-11-01"
issue: "#337"
title: "AI package with a fake provider"
---

The AI layer starts as `packages/ai` on the Vercel AI SDK: `analyzeDesign` uses structured output (the Zod schema goes to the model as JSON Schema) and `proposeEdit` uses tool calling, whose calls become a `SpecPatch` that the engine's `applySpecPatch` accepts or refuses. A fake provider, a real AI SDK model that answers from fixtures, lets tests, local dev and CI run the whole call path with no key. The prompt catalogue is generated from the schema and drift-tested.

Read: [AI providers](../tech/ai-providers.md), [AI package](../../backend/ai.md), [ADR-337](../../decisions/337-ai-package.md)
