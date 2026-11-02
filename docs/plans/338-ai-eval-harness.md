# Plan #338: AI evaluation harness

plan:opus · build:opus · size M (unchanged) · M6 wave 2 · SRS §12 (M6), §9 (cost), NFR-02 · ADR-335 items 2, 9 · builds on `@tafsila/ai` (#337: `analyzeDesign`, `createFakeAi`, `AiUsage`, `PRICE_TABLE_USD_PER_MTOK`)

### Approach

A script plus a pure scoring module. The scorer is tested to the last digit because #347's decision rests on it. No real provider call in any test or in CI.

- **Command:** `pnpm ai:eval --provider <fake|anthropic|google> --model <id> --photos <dir|url-list> [--labels <file>] [--out <dir>] [--only <ids>]`. Root script `ai:eval` runs `packages/ai/scripts/eval.ts` (tsx, like `print.ts`). Provider, model and key come from the same env names as the API (`AI_API_KEY`), the CLI flags override `AI_PROVIDER`/`AI_MODEL_ANALYZE`.
- **Inputs:** `labels.json` (format fixed by #336: `[{ id, photo, category, spec, unsupported[] }]`) and the photos folder (a private local folder or a list of signed URLs; the photos never enter the repo). Until #336 lands, `packages/test-fixtures/src/ai-eval/labels.sample.json` holds 3 labels over fixture designs (no photos; the fake provider answers from the category hint), and the CI run uses it.
- **Scoring (`packages/ai/src/eval/score.ts`, pure):**
  - the compared features are the `DESIGN_FEATURE_PATHS` of the schemas (category, bodice.fit/shaping, neckline.front/back/collar, sleeve.type/length/cuff, skirt.type/length, waistband, closure.type/position, pockets, lining, belt);
  - a feature is **correct** when the analysed value equals the label; an optional feature absent in both is correct (counted only when the label says the feature exists or the model invented one, to avoid inflating accuracy with "none"); `pockets` compares as a set; features not applicable to the category are skipped;
  - **overall feature accuracy** = correct / compared over all photos (micro) and the mean per photo (macro); the exit uses the micro figure;
  - per-feature accuracy and counts; a list of the 15 most common wrong answers (`label → predicted`, count);
  - **confidence check:** accuracy of features with confidence < 0.6 and ≥ 0.6, and how many wrong features were flagged (recall of the flag), because the confirmation screen relies on it;
  - **unsupported features:** recall of the labelled unsupported items by fuzzy token match on the text, reported separately (not in the 80 %).
- **Latency and cost:** p50 and p95 of `usage.latencyMs` (NFR-02 bound 30 s), tokens, cost per photo in USD from `usage.costUsd` and in EGP with a `--usd-egp` rate (default 50, printed in the report); the target ≤ 5 EGP per pattern is compared with the average cost per photo plus a stated chat allowance.
- **Run behaviour:** fixed photo order (by id), temperature 0 (already in `analyzeDesign`), one retry on `AiOutputInvalidError` is the package's; a failed photo counts as all features wrong and is listed; a per-call timeout of 60 s; a `--max-photos` and `--budget-usd` flag stops the run when the estimated spend would pass it (guards the cap agreed on #347).
- **Output:** `eval-runs/<timestamp>-<provider>-<model>.json` (all raw answers and scores, git-ignored) and a markdown summary printed and saved next to it (table per feature, latency, cost, confusion list).

### Files

Create: `packages/ai/scripts/eval.ts`, `packages/ai/src/eval/{score.ts,report.ts,percentile.ts,labels.ts,run.ts}` with tests, `packages/test-fixtures/src/ai-eval/labels.sample.json` (+ a Zod validation test), `docs/test-cases/ai/eval-run.md` (how to run, how to read the report), `docs/decisions/338-ai-eval-harness.md`.
Change: root `package.json` (`ai:eval`), `.gitignore` (`eval-runs/`), `packages/ai/package.json`, `docs/backend/ai.md` (an "Evaluation" section), `docs/CONTEXT_MAP.md`, glossary (accuracy, p95, confusion list), learning log.

No API, table or UI change; the package stays server-only (the script is a dev tool, not exported).

### Test plan

- **Scorer unit tests with hand-made labels:** all correct → 100 %; one wrong enum → the exact fraction; a missing optional feature when the label has it → wrong; the model inventing `waistband` when the label has none → wrong; `pockets` as a set (order ignored); a blouse skips skirt features; micro vs macro differ on an uneven example.
- **Confidence:** two wrong features flagged below 0.6 and one wrong above → flag recall 2/3; accuracy per band.
- **Unsupported recall:** token match "puff sleeve" ↔ "puffed sleeves" counts; unrelated text does not.
- **Percentiles and cost:** p50/p95 of a known list (nearest-rank, documented); EGP conversion; the budget guard stops after the call that would pass the limit and says so.
- **Run with the fake provider on the 3 sample labels** (this is the CI test): the report has every section, a failing photo is listed and does not abort the run, and two runs give byte-identical JSON apart from the timestamp.
- **Labels validation:** the sample labels parse with `designSpecSchema`; a label with an invalid enum fails the test.
- No network in any test.

Manual test cases (draft): TC-AI-338-01 run with the fake provider and read the report; 02 run `--max-photos 2 --budget-usd 0.01` stops early; 03 (after #347 is approved) one photo with a real key.

### Decisions to log (`docs/decisions/338-ai-eval-harness.md`)

1. Micro accuracy over all compared features is the exit number; macro is shown beside it.
2. "Absent in both" optional features are not counted as correct.
3. Unsupported-feature recall is reported but not part of the 80 %.
4. EGP conversion is a flag with a default and printed in the report.
5. A budget flag stops the run (protects the cap Merna sets on #347).

None is costly to reverse.

### Risks

- **Score definition disputes:** the rules above are written before any real run, so the 80 % cannot be tuned afterwards; Merna can change a rule in the decision file before #347 runs.
- **Overfitting the labels** to the fake provider: the sample set is only for CI.
- **Accidentally committing photos:** `eval-runs/` is ignored and the photos path is outside the repo; the script refuses a photos path inside the repo root.

### Labels and needs

Size M, `plan:opus`, `build:opus` stay. `needs-interactive` on the planned files: `no`.

## Deviations

- The markdown summary is in its own module (`packages/ai/src/eval/markdown.ts`) and the command-line side (flags, photo loader, price override) in `packages/ai/src/eval/cli.ts`, so `report.ts` and the script stay small and the flag parsing is unit-tested.
- The sample labels are validated by `packages/ai/src/eval/labels.test.ts` (the label schema lives in `@tafsila/ai`; `@tafsila/test-fixtures` cannot import it). The file is exported as `@tafsila/test-fixtures/ai-eval/labels.sample.json`.
- Added `--hint` (off by default; decision 338, 6), `--timeout-ms`, `--chat-egp` and the price flags `--input-usd-per-mtok`/`--output-usd-per-mtok` (a real model has no price row until #347). The photos URL list is a text file of `<photo name> <URL>` lines.
- `LOW_CONFIDENCE` (0.6) was added to `@tafsila/schemas` so the confirmation screen (#339) can share it.
- All `DESIGN_FEATURE_PATHS` are compared, including `bodice.waistSeam` and `skirt.slit`, as the plan's first rule says.
