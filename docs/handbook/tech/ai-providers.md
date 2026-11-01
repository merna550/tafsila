---
packages: [ai, "@ai-sdk/anthropic", "@ai-sdk/google"]
level: intermediate
adr: ADR-002
---

# AI providers (Anthropic Claude, Google Gemini)

**In one line:** AI models that read a garment photo and fill a validated `DesignSpec`; they never draw geometry. Called through `packages/ai` on the Vercel AI SDK (#337).

## What it is (plain words)

A multimodal model takes an image plus instructions and returns text or structured data. We call it through the Vercel AI SDK (package `ai`) with one provider package per vendor (`@ai-sdk/anthropic`, `@ai-sdk/google`), and require the answer to match a [Zod](zod.md) schema.

## Why we chose it

- **AI understands, the engine draws** ([ADR-002](../../DECISIONS.md)). A model is good at "this is a V-neck, set-in sleeve, A-line skirt" and bad at millimetre-accurate curves. So AI output is only a `DesignSpec`; the deterministic engine produces every line.
- **Structured output.** Schemas exported as JSON Schema make the model answer in a fixed shape, and we reject anything that fails validation ([structured output](../glossary.md#structured-output)).
- **Provider-neutral.** Models change fast and prices move; we can swap by price and quality without touching business code ([ai-provider](../glossary.md#ai-provider)). `AI_PROVIDER` (`fake`, `anthropic` or `google`), `AI_MODEL_ANALYZE`, `AI_MODEL_CHAT` and `AI_API_KEY` are environment settings ([ADR-337](../../decisions/337-ai-package.md)).
- **One SDK for both vendors.** The AI SDK gives structured output and [tool calling](../glossary.md#tool-calling) with the same code for Claude and Gemini, and ships test models, so tests never call the network. Versions are pinned exactly because the SDK changes fast.
- **Cheap models in dev and preview, production model in staging and prod** ([WORKFLOW section 7](../../WORKFLOW.md)).

## Alternatives we considered (and why not)

- **One hard-wired vendor:** lock-in and no price leverage.
- **Letting AI output SVG or coordinates:** inaccurate and untestable.

## When we would change it

The provider choice is an open decision pending an evaluation on real garment photos ([CLAUDE.md status](../../../CLAUDE.md)). Re-run that evaluation when a new model generation is released or prices change.

## Where it lives in our code

- `packages/ai/src/` (`analyzeDesign`, `proposeEdit`, `provider.ts` holds every provider call, `fake-model.ts` the [fake provider](../glossary.md#fake-provider)); page: [AI package](../../backend/ai.md).
- `packages/config/src/env.ts` (`AI_PROVIDER`, `AI_MODEL_ANALYZE`, `AI_MODEL_CHAT`, `AI_API_KEY`, `loadAiConfig`).
- `packages/schemas/src/design-spec.ts` (the only thing AI may produce), `design-analysis.ts`, `spec-patch.ts`.
- `packages/engine/src/spec-rules/apply-spec-patch.ts` (the engine decides whether an AI edit is valid).

## The 20% you need

- Never trust the model: parse with `designSpecSchema`, then run engine validation. Invalid output is retried once with the error.
- Each answer carries a [confidence](../glossary.md#confidence-score) per feature; low ones get a note for the user.
- Send the smallest image that works; strip EXIF; store originals privately ([HEIC/EXIF](../glossary.md#exif)).
- Keep prompts in files, versioned, with test photos.

```ts
const { result, usage } = await analyzeDesign({ photos }, { config: loadAiConfig() });
const { patch, outcome } = await proposeEdit(
  { spec: result.spec, message: "add side pockets" },
  createFakeAi(),
);
```

## Commands you'll use

`pnpm --filter @tafsila/ai print skirt "add side pockets"` runs both calls with the configured provider (fake by default). `pnpm --filter @tafsila/ai test` runs the package tests.

## Common mistakes

- Putting API keys in code or images (config only through `packages/config/env.ts`).
- Calling a vendor SDK outside `packages/ai/src/provider.ts`, or importing `@tafsila/ai` anywhere but `packages/api` (dependency-cruiser fails).
- Adding an enum value to `designSpecSchema` without a definition in `FEATURE_DEFINITIONS` (the drift test fails).

## Learn more

- [Anthropic docs](https://docs.anthropic.com/), [Gemini API docs](https://ai.google.dev/gemini-api/docs), [Vercel AI SDK](https://ai-sdk.dev/docs) (all official)
- Glossary: [LLM](../glossary.md#llm), [DesignSpec](../glossary.md#designspec)
