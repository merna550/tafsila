# AI package (`packages/ai`)

`@tafsila/ai` turns garment photos into a `DesignSpec` and chat messages into spec changes, with Claude or Gemini chosen by configuration only (SRS §9, §2.4). The AI never draws: it fills or edits a `DesignSpec`, and the engine draws ([ADR-002](../DECISIONS.md)). Decisions: [ADR-335](../decisions/335-m6-scope.md), [ADR-337](../decisions/337-ai-package.md).

## Entry points

| Function                     | Input                                                                  | Output                                    |
| ---------------------------- | ---------------------------------------------------------------------- | ----------------------------------------- |
| `analyzeDesign(input, deps)` | `{ photos: { url \| bytes, mediaType, view }[], hint?: { category } }` | `{ result: DesignAnalysisResult, usage }` |
| `proposeEdit(input, deps)`   | `{ spec, message, history? }`                                          | `{ patch: SpecPatch, outcome, usage }`    |
| `createFakeAi()`             | none                                                                   | `deps` that use the fake provider         |

`DesignAnalysisResult` and `SpecPatch` are in `@tafsila/schemas` (`design-analysis.ts`, `spec-patch.ts`). `outcome` is `applySpecPatch(spec, patch)` from `@tafsila/engine/spec-rules`: the new spec and its `changes`, or the issues.

## Configuration

The package never reads the environment. The API reads it with `loadAiConfig()` from `packages/config/env.ts` and passes `{ config }`:

| Variable           | Values                                  | Notes                            |
| ------------------ | --------------------------------------- | -------------------------------- |
| `AI_PROVIDER`      | `fake` (default), `anthropic`, `google` | `fake` is refused in production  |
| `AI_MODEL_ANALYZE` | model id                                | stronger vision model            |
| `AI_MODEL_CHAT`    | model id                                | cheaper model                    |
| `AI_API_KEY`       | key                                     | never in code, images or commits |

Switching provider is an env change only. Real keys are out of scope until the evaluation (#347).

## Fake provider

`createFakeModel` (`src/fake-model.ts`) is an AI SDK language model that answers from `src/fixtures/answers.ts`: an analysis per category hint, and chat tool calls per keyword (`pocket`/`جيب`, `longer`/`أطول`, `jumpsuit`/`جمبسوت`; anything else is explained as not understood). API tests and e2e reuse these fixtures. Tests that need other answers pass an AI SDK test model (`MockLanguageModelV4` from `ai/test`) as `deps.model`; see `src/test-models.ts`. No test calls the network.

## Output rules

- **Analysis** uses structured output: the Zod schema goes to the model as JSON Schema, temperature 0. An invalid answer is retried once with the validation error; a second one throws `AiOutputInvalidError` (`AI_OUTPUT_INVALID`). A spec the engine refuses is corrected by `normalizeSpec`, with confidence 0 and a note on each changed feature.
- **Chat** uses tool calling: `setFeature`, `setLength`, `addPocket`, `removePocket`, `explainUnsupported`. The calls become a `SpecPatch`; invalid calls or a refused patch are retried once with the reasons, then answered as unsupported with no ops.
- **Prompt catalogue:** `buildCataloguePrompt()` lists every enum value of `designSpecSchema` with a short English visual definition (`FEATURE_DEFINITIONS`) and the length limits. A test fails when the schema and the definitions disagree: add a definition when you add an enum value.

## Usage

Every call returns `usage`: provider, model, input and output tokens (all attempts), latency, attempts and `costUsd`, an estimate from `PRICE_TABLE_USD_PER_MTOK` (`src/usage.ts`), `undefined` for a model without a price row. The API stores it in `ai_usage`.

## Try it

```bash
pnpm --filter @tafsila/ai print skirt "add side pockets"   # optional 3rd argument: an https photo URL
```

Prints the fake analysis and the chat patch. With `AI_PROVIDER` set to a real provider (only after #347), it calls that provider.

## Evaluation

`pnpm ai:eval` scores a provider and model on labelled photos (issue #338, [decision 338](../decisions/338-ai-eval-harness.md)); the provider choice (#347) and the M6 exit (≥ 80 % feature accuracy) use its numbers. It calls `analyzeDesign` once per label in id order and writes `eval-runs/<time>-<provider>-<model>.json` (raw answers and scores) and `.md` (summary), both git-ignored.

```bash
pnpm ai:eval --hint                                                    # fake provider, 3 sample labels
pnpm ai:eval --provider anthropic --model <id> --photos <folder|url-list> --budget-usd <cap>   # only after #347
```

| Module (`src/eval/`)       | Does                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `labels.ts`                | `labels.json` schema (`id`, `photo`, `category`, `spec`, `unsupported[]`), sorted by id                   |
| `score.ts`                 | pure scoring: per-feature compare, micro/macro, confusion list, confidence-flag check, unsupported recall |
| `percentile.ts`            | nearest-rank p50/p95                                                                                      |
| `run.ts`                   | the run: timeout, failed photos, `--max-photos`, `--budget-usd`                                           |
| `report.ts`, `markdown.ts` | the JSON report (latency vs NFR-02, cost in USD and EGP vs SRS §9) and its summary                        |
| `cli.ts`                   | flags, photo loader (folder outside the repo, or `<photo> <URL>` lines), price flags                      |

Photos never enter the repo: the command refuses a photos folder inside it. CI runs the fake provider on `packages/test-fixtures/src/ai-eval/labels.sample.json` in `src/eval/run.test.ts`. How to read the report: [test cases](../test-cases/ai/338-eval-run.md).

## How to add a provider

1. Add the AI SDK provider package with an exact version and list it in the [AI providers card](../handbook/tech/ai-providers.md).
2. Add the name to `AI_PROVIDERS` in `packages/config/src/env.ts` (and its test).
3. Add one branch in `createModel` (`packages/ai/src/provider.ts`) and a constructed-only test in `provider.test.ts`.
4. Add its models to `PRICE_TABLE_USD_PER_MTOK` once they are chosen.

## Testing helpers

`@tafsila/ai/testing` exports `scriptedModel`, `scriptedDeps` and `fakeAnalysis` for API tests that need a scripted provider answer (issue #340). `AiOutputInvalidError.usage` carries the tokens of a refused answer so the API can still record its cost.

## Boundaries

Server-only. dependency-cruiser allows only `packages/api` to import `@tafsila/ai`, and the package never imports the API, web or UI. No prompts or photos are logged (NFR-05).
