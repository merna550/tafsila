## Plan #337: packages/ai, provider-neutral analyzeDesign and proposeEdit

plan:opus · build:opus · size M (unchanged) · M6 wave 1 · FR-DES-03, FR-DES-07, FR-CHAT-02, FR-CHAT-04, SRS §9, §2.4 · ADR-002, ADR-335 items 1, 4, 9 · env already has `AI_PROVIDER` (`anthropic|google`), `AI_MODEL_ANALYZE`, `AI_API_KEY` (ADR-021)

### Approach

A pure-ish package `@tafsila/ai` (depends on `@tafsila/schemas`, `@tafsila/engine/spec-rules`, the Vercel AI SDK `ai` and the provider packages `@ai-sdk/anthropic` and `@ai-sdk/google`). It never touches HTTP, the database or Next; the API wires it through a port.

**Schemas (`packages/schemas/src/design-analysis.ts`, `spec-patch.ts`):**

- `designAnalysisResultSchema`: `{ spec: DesignSpec, confidence: Record<FeaturePath, number 0..1>, notes: { path, text: {ar,en} }[], unsupported: { text: {ar,en} }[], category: { value, confidence } }`. `FeaturePath` is the typed list of spec feature paths (shared with `RULE_PATHS` of fabric-kb where possible; one source in `@tafsila/schemas`: `DESIGN_FEATURE_PATHS`, with a test against `designSpecSchema`).
- `specPatchSchema`: a list of ops `{ op: "set", path, value } | { op: "setLength", path, mm } | { op: "addPocket", type } | { op: "removePocket", type }` plus `{ unsupported?: { text, closest?: op[] } }`.
- `applySpecPatch(spec, patch)` (pure, in `packages/schemas` or `packages/engine/spec-rules` — put it next to the spec rules in the engine `spec-rules` entry since it must run them): applies the ops, then the engine's spec rules (`resolveSpec`/validation); returns `{ ok: true, spec, changes: {path, from, to}[] } | { ok: false, issues }`. Invalid paths, values or lengths outside the catalogue limits are rejected.

**Package (`packages/ai/src/`):**

- `config.ts`: reads `AiConfig { provider: "anthropic" | "google" | "fake", analyzeModel, chatModel, apiKey }` passed in by the caller (the API reads `packages/config/env.ts`); env gets `AI_PROVIDER` + `"fake"`, `AI_MODEL_CHAT`, and `fake` as the default for `local`/`test`/CI (ADR-335 item 1). Production still requires the key (ADR-021).
- `provider.ts`: `createModel(config, kind)` returns an AI SDK `LanguageModel` (`anthropic(model)`, `google(model)`) or the fake model (`MockLanguageModelV2`-style from `ai/test`, answering from fixtures). Swapping provider is config only (SRS §2.4).
- `catalogue-prompt.ts`: builds the catalogue section of the system prompt from `designSpecSchema` enums plus a short visual definition table `FEATURE_DEFINITIONS` (ar/en definitions are not needed for the model; English only) keyed by enum value; a test fails when an enum value has no definition or a definition has no enum value (drift test, acceptance criterion).
- `analyze-design.ts`: `analyzeDesign({ photos: { url | bytes, mediaType, view }[], hint?: { category } }, deps)` uses `generateObject` with the Zod schema (JSON Schema to the model), temperature 0; on schema failure retries once with the validation error in the message, then throws `AiOutputInvalidError` (SRS §9). Output is post-validated with `designSpecSchema` and `applySpecPatch`'s spec rules (a spec the engine refuses is downgraded: the offending features get confidence 0 and a note).
- `propose-edit.ts`: `proposeEdit({ spec, message, history }, deps)` uses `generateText` with tools `setFeature`, `setLength`, `addPocket`, `removePocket`, `explainUnsupported`; tool calls are collected into a `SpecPatch` and checked with `applySpecPatch`; an invalid patch is retried once, then returned as `unsupported`.
- `usage.ts`: every call returns `usage { provider, model, inputTokens, outputTokens, latencyMs, costUsd }` with a price table per model in one constant (estimate; documented as such).
- `fixtures/`: fake answers for `analyzeDesign` (by photo id or category hint) and `proposeEdit` (by message keyword: "pocket", "sleeve longer", "unsupported"), reused by API tests and e2e.
- `index.ts` exports only the two functions, the types and `createFakeAi`.

No prompt is sent with user data beyond the photos and the spec; no logging of prompts or photos (NFR-05; Sentry scrubber unchanged).

### Files

Create: `packages/ai/{package.json,tsconfig.json,vitest.config.ts}`, `packages/ai/src/*` with tests; `packages/schemas/src/design-analysis.ts`, `spec-patch.ts` (+ tests, exports); `packages/engine/src/spec-rules/apply-spec-patch.ts` (+ tests, exported from the `spec-rules` entry); `docs/backend/ai.md` (package page: entry points, config, fake provider, retry, usage, how to add a provider); `docs/decisions/337-ai-package.md`.
Change: `packages/config/src/env.ts` (+ test: `fake` provider, `AI_MODEL_CHAT`, default `fake` outside production), `.env.example`, `.dependency-cruiser.cjs` (`@tafsila/ai` only imported by `packages/api`; never by `apps/web` or `packages/engine`), `docs/ARCHITECTURE.md` (packages/ai line), `docs/CONTEXT_MAP.md` (AI row), `docs/SRS.md` §9 (fake provider, retry wording), glossary (structured output, tool calling, confidence, fake provider), learning log. Dependency cards in the handbook for `ai`, `@ai-sdk/anthropic`, `@ai-sdk/google` (`docs:check` requires a card per dependency).

### Test plan

- **Schemas:** a result with confidence 1.2 or an unknown path is rejected; a patch with an unknown op is rejected.
- **`applySpecPatch`:** set `sleeve.length` to `long` on `setInSleeveBlouse` → ok with one change; set `skirt.type` on a blouse → rejected; `setLength skirt.lengthMm 5000` → rejected (outside limits); `addPocket side-seam` twice → one pocket; changes list is ordered and deterministic.
- **Catalogue prompt drift:** every enum value of `designSpecSchema` has a definition; adding a fake enum value in a test schema fails.
- **analyzeDesign (fake model):** returns a valid result for a dress fixture; an invalid first answer then a valid one → one retry; two invalid answers → `AiOutputInvalidError`; a spec the engine refuses → that feature's confidence 0 with a note; usage is filled.
- **proposeEdit (fake model):** "add side pockets" → patch with `addPocket`; "make it a jumpsuit" → `unsupported` with a closest option; a tool call with an invalid value → retried once, then `unsupported`.
- **Provider switch:** `createModel` returns the anthropic/google model objects for the config (no network: constructed only); `fake` needs no key.
- **Env:** `AI_PROVIDER=fake` accepted; production without a key still fails.
- No network calls in any test (MSW not needed: the AI SDK test models are used).

Manual test cases (draft, `docs/test-cases/api/337-ai-package.md`): TC-AI-337-01 run the package's `print` script with the fake provider; 02 with a real key locally (only after #347's decision) for one photo.

### Decisions to log (`docs/decisions/337-ai-package.md`)

1. `applySpecPatch` lives with the engine spec rules (one place validates specs).
2. `fake` is a first-class provider and the default outside production.
3. Feature definitions for the prompt are English-only text, keyed by enum value, drift-tested.
4. Retry once with the validation error; then a typed error.
5. Cost is an estimate from a price table; `ai_usage` stores it as such.

None is costly to reverse.

### Risks

- **AI SDK version churn:** pin exact versions; the provider wrappers are isolated in `provider.ts`.
- **Bundle leakage into the web app:** dependency-cruiser rule; the package is server-only.
- **Prompt quality** is measured in #338/#347, not here; this issue only fixes the structure.

### Labels and needs

Size M, `plan:opus`, `build:opus` stay. `needs-interactive` on the planned files: `no`.

### Deviations

- **Env names:** the chat model is `AI_MODEL_CHAT`, next to the existing `AI_MODEL_ANALYZE` (as the plan's header says); the issue and ADR-335 wrote `AI_ANALYZE_MODEL`/`AI_CHAT_MODEL`. Logged in ADR-337.
- **Feature paths:** `DESIGN_FEATURE_PATHS` moved from the engine to `@tafsila/schemas`; the engine re-exports it as `FEATURE_PATHS`. Fabric-kb's `RULE_PATHS` is unchanged (it describes rule conditions, not spec features).
- **`analyzeDesign`** uses `generateText` with `Output.object` instead of `generateObject`: the same structured output (schema sent as JSON Schema, answer validated), with one call style for both functions.
- **Fake model** is a plain AI SDK language model object in `src/fake-model.ts`, not `MockLanguageModel` from `ai/test` (test-only code stays out of the runtime path); tests use `MockLanguageModelV4`.
- **Price table** has only the `fake` row; real model prices are added when #347 picks the models (cost is `undefined` until then, not guessed).
- **`proposeEdit`** returns `{ patch, outcome, usage }`, where `outcome` is `applySpecPatch`'s result, so the API does not apply the patch a second time.
- **Print script:** `pnpm --filter @tafsila/ai print [category] [message] [photo URL]` (TC-AI-337-01 to 03).
