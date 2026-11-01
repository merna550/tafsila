# Test cases — AI package (analyzeDesign, proposeEdit)

| Field        | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| Issue        | #337                                                       |
| SRS          | FR-DES-03, FR-DES-07, FR-CHAT-02, FR-CHAT-04, SRS §9, §2.4 |
| Area         | ai                                                         |
| Last updated | 2026-11-01 (by PR for #337)                                |

## Test data

No database or account is needed. The fake provider answers from `packages/ai/src/fixtures/answers.ts`; see [the AI package page](../../backend/ai.md).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                  | Priority | Preconditions                                          | Steps                                                                                                                         | Expected result                                                                                                         | Automated by                                     | dev | staging |
| ------------ | -------------------------------------- | -------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --- | ------- |
| TC-AI-337-01 | Run both calls with the fake provider  | High     | `AI_PROVIDER` unset or `fake`                          | `pnpm --filter @tafsila/ai print skirt "add side pockets"`                                                                    | A skirt analysis with confidence and one note, usage `fake/fake`; a patch, and an outcome the engine accepts or refuses | `analyze-design.test.ts`, `propose-edit.test.ts` | ⬜  | ⬜      |
| TC-AI-337-02 | Unsupported chat request               | Medium   | Fake provider                                          | `pnpm --filter @tafsila/ai print dress "make it a jumpsuit"`                                                                  | No ops; `unsupported` text in Arabic and English with the closest option "dress"                                        | `propose-edit.test.ts`                           | ⬜  | ⬜      |
| TC-AI-337-03 | One real photo with a real key (local) | Low      | Only after the provider decision (#347); key in `.env` | Set `AI_PROVIDER`, both models and `AI_API_KEY`; `pnpm --filter @tafsila/ai print dress "add side pockets" <https photo URL>` | A valid analysis; usage shows the real model and tokens                                                                 | manual only                                      | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
