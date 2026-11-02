# ADR-338 · 2026-11-02 · AI evaluation harness: scoring rules written before any real run

**Context:** Issue #338 builds `pnpm ai:eval`, the harness that scores a provider and model on the 50-photo set so the provider choice (#347, [ADR-335](335-m6-scope.md) item 9) and the M6 exit (≥ 80 % feature accuracy, [SRS](../SRS.md) §12) are numbers. The scoring rules decide that number, so they are fixed here before any real run; Merna can change a rule in this file before #347 runs. None is costly to reverse.

**Decision:**

1. **The exit figure is micro accuracy**: correct features / compared features over all photos. Macro accuracy (the mean of each photo's accuracy) is shown beside it.
2. **What is compared:** every feature of `DESIGN_FEATURE_PATHS` that applies to the label's category (the engine's `featureApplies`). A feature is correct when the analysed value equals the label; pockets compare as a set. For the optional features (skirt slit, waistband, pockets, belt) `"none"` means absent, and a feature **absent in both is not counted**, so "none" answers cannot inflate the figure. A feature the label has and the model left out, or one the model invented, is wrong. A failed call (refused answer, timeout, missing photo) makes every labelled feature wrong and is listed.
3. **Unsupported-feature recall is reported but not part of the 80 %**: a labelled item counts as found when at least half of its content words (lower case, rough stem) appear in one item the model reported.
4. **Money:** cost per photo comes from `usage.costUsd`; a model without a price row gets its price from `--input-usd-per-mtok`/`--output-usd-per-mtok`, otherwise its cost is "unknown". EGP uses `--usd-egp` (default 50) and the pattern cost adds a chat allowance `--chat-egp` (default 1 EGP); both are printed in the report and compared with the 5 EGP target (SRS §9).
5. **Budget guard:** `--budget-usd` stops the run before a call when the spend so far plus the average cost per call would pass the budget; a budget with an unknown cost stops after the first call. `--max-photos` caps the photos. Both protect the cap Merna sets on #347.
6. **No category hint by default** (`--hint` sends the label's category), so category accuracy is measured; the app's hint is optional (FR-DES-02). The CI run uses the hint, because the fake provider answers per category.
7. **Confidence check:** features below `LOW_CONFIDENCE` (0.6, now one constant in `@tafsila/schemas`) count as flagged; a feature with no confidence counts as sure. The report gives accuracy per band and the share of wrong features that were flagged.
8. **Latency:** p50 and p95 by the nearest-rank method over `usage.latencyMs`, compared with the NFR-02 bound (30 s). Each call has a 60 s timeout.

Also: the run is in label-id order with temperature 0 (already in `analyzeDesign`). The photos folder must be outside the repository (the command refuses one inside it) and the output goes to the git-ignored `eval-runs/`. Until #336 lands, `packages/test-fixtures/src/ai-eval/labels.sample.json` (3 labels over fixture designs, no photos) is the CI set; the fake provider gets placeholder URLs it never fetches.

**Alternatives:** Macro accuracy as the exit (one hard photo would swing it). Counting "absent in both" as correct (every skirt without a slit would score). Unsupported recall inside the 80 % (free-text matching is too loose for an exit gate). A fixed EGP rate in code (the rate moves). Stopping only after the budget is passed (spends past Merna's cap).
