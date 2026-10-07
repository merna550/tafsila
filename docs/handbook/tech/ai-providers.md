---
packages: [ai, "@anthropic-ai/sdk", "@google/genai"]
level: intermediate
adr: ADR-002
---

# AI providers (Anthropic Claude, Google Gemini)

**In one line:** AI models that read a garment photo and fill a validated `DesignSpec`; they never draw geometry. Planned for M6.

## What it is (plain words)

A multimodal model takes an image plus instructions and returns text or structured data. We call it through a provider SDK (or the Vercel AI SDK, package `ai`) and require the answer to match a [Zod](zod.md) schema.

## Why we chose it

- **AI understands, the engine draws** ([ADR-002](../../DECISIONS.md)). A model is good at "this is a V-neck, set-in sleeve, A-line skirt" and bad at millimetre-accurate curves. So AI output is only a `DesignSpec`; the deterministic engine produces every line.
- **Structured output.** Schemas exported as JSON Schema make the model answer in a fixed shape, and we reject anything that fails validation ([structured output](../glossary.md#structured-output)).
- **Behind the `AIProvider` port.** Models change fast and prices move; we can swap by price and quality without touching business code ([ai-provider](../glossary.md#ai-provider)). `AI_PROVIDER` (`anthropic` or `google`) and `AI_MODEL_ANALYZE` are environment settings.
- **Cheap models in dev and preview, production model in staging and prod** ([WORKFLOW section 7](../../WORKFLOW.md)).

## Alternatives we considered (and why not)

- **One hard-wired vendor:** lock-in and no price leverage.
- **Letting AI output SVG or coordinates:** inaccurate and untestable.

## When we would change it

The provider choice is an open decision pending an evaluation on real garment photos ([CLAUDE.md status](../../../CLAUDE.md)). Re-run that evaluation when a new model generation is released or prices change.

## Where it lives in our code

- `packages/config/src/env.ts` (`AI_PROVIDER`, `AI_MODEL_ANALYZE`, `AI_API_KEY`).
- `packages/schemas/src/design-spec.ts` (the only thing AI may produce).
- Adapter: packages/api/src/adapters/ai/ (planned); port in `packages/api/src/ports/`.

## The 20% you need

- Never trust the model: parse with `designSpecSchema`, then run engine validation.
- Send the smallest image that works; strip EXIF; store originals privately ([HEIC/EXIF](../glossary.md#exif)).
- Keep prompts in files, versioned, with test photos.

## Commands you'll use

None yet. Cost and prompt evaluation scripts are planned for M6.

## Common mistakes

- Putting API keys in code or images (config only through `packages/config/env.ts`).
- Calling the vendor SDK from a service instead of the adapter.

## Learn more

- [Anthropic docs](https://docs.anthropic.com/), [Gemini API docs](https://ai.google.dev/gemini-api/docs), [Vercel AI SDK](https://ai-sdk.dev/docs) (all official)
- Glossary: [LLM](../glossary.md#llm), [DesignSpec](../glossary.md#designspec)
