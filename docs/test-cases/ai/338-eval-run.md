# Test cases — AI evaluation harness (`pnpm ai:eval`)

| Field        | Value                            |
| ------------ | -------------------------------- |
| Issue        | #338                             |
| SRS          | §12 (M6 exit), §9 (cost), NFR-02 |
| Area         | ai                               |
| Last updated | 2026-11-02 (by PR #364)          |

## Test data

| Name          | Value                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------- |
| Sample labels | `packages/test-fixtures/src/ai-eval/labels.sample.json` (3 labels, no photos)                |
| Real set      | Merna's private folder or a signed-URL list with `labels.json` (#336); never inside the repo |

## How to run

```bash
pnpm ai:eval --hint                                   # fake provider, sample labels
pnpm ai:eval --max-photos 2 --budget-usd 0.01         # stops early, says why
# after #347 approves a budget (key only in the environment, never in a file in the repo):
AI_API_KEY=... pnpm ai:eval --provider anthropic --model <id> --photos ~/tafsila-eval \
  --input-usd-per-mtok <price> --output-usd-per-mtok <price> --budget-usd <cap>
```

Other flags: `--labels <file>` (default `labels.json` in the photos folder), `--only id1,id2`, `--out <dir>` (default `eval-runs/`), `--usd-egp 50`, `--chat-egp 1`, `--timeout-ms 60000`. A URL list is a text file with one `<photo name> <https URL>` per line.

## How to read the report

- **Feature accuracy (micro)** is the M6 exit figure (≥ 80 %); macro is beside it. Rules: [decision 338](../../decisions/338-ai-eval-harness.md).
- **Accuracy per feature** shows where the model is weak; **most common wrong answers** shows which values it mixes up.
- **Confidence flag:** "Wrong features flagged" is the share of mistakes the confirmation screen would ask about; higher is safer.
- **Latency:** p95 must be under 30 000 ms (NFR-02). **Cost:** per pattern (photo + chat allowance) must be ≤ 5 EGP (SRS §9); "unknown" means the model has no price: pass the price flags.
- **Failed photos** count as all wrong; check the error (missing photo, timeout, invalid answer twice).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                              | Priority | Preconditions                      | Steps                                                      | Expected result                                                                                                      | Automated by                       | dev | staging |
| ------------ | ---------------------------------- | -------- | ---------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | --- | ------- |
| TC-AI-338-01 | Fake run and read the report       | High     | `pnpm install`                     | 1. `pnpm ai:eval --hint` 2. Open the `.md` in `eval-runs/` | Every section present (accuracy per feature, confidence, latency and cost, wrong answers, failed photos); no network | `packages/ai/src/eval/run.test.ts` | ✅  | ⬜      |
| TC-AI-338-02 | Budget and photo cap stop early    | High     | none                               | `pnpm ai:eval --max-photos 2 --budget-usd 0.01`            | "Stopped early (max-photos) after 2 photos."                                                                         | `packages/ai/src/eval/run.test.ts` | ✅  | ⬜      |
| TC-AI-338-03 | Photos inside the repo are refused | High     | none                               | `pnpm ai:eval --photos docs`                               | Error: `--photos must be outside the repository`                                                                     | `packages/ai/src/eval/cli.test.ts` | ✅  | ⬜      |
| TC-AI-338-04 | One photo with a real key          | Medium   | #347 approved, budget set by Merna | Real-provider command above with `--only <one id>`         | One photo scored, cost and latency known, no file in `git status`                                                    | manual only                        | ⬜  | ⬜      |

## Manual run log

| Date       | Env   | Tester | Result | Notes                             |
| ---------- | ----- | ------ | ------ | --------------------------------- |
| 2026-11-02 | local | Claude | ✅     | TC-AI-338-01 to 03, fake provider |
