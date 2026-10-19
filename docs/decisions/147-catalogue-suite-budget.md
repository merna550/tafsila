# ADR-147 · 2026-10-19 · Catalogue suite, run count and speed guard

**Context:** Issue #147 (FR-PAT-01..06, FR-PAT-04, NFR-02, NFR-10). Plan: [`docs/plans/147-catalogue-matrix.md`](../plans/147-catalogue-matrix.md). Cheap to reverse: test-only constants.
**Decision:**

1. **Arbitrary reuses the engine's rules.** `arbDesignSpec()` filters with the compatibility predicates the modules already export (closure, pocket, collar, sleeve, slit, one-piece dress); there is no second copy.
2. **Known bugs are excluded, not fixed here.** `hitsKnownBug(spec, bodyId)` lists combinations that break (#229 to #232), each with its issue. Remove an entry when its issue closes.
3. **Report check:** every non-pass check must be in `ALLOWED_WARNINGS` (advice) or `ALLOWED_REFUSALS` (body- or length-dependent input refusals the arbitrary cannot filter). Anything else fails and prints the spec and the measurements.
4. **Run count 60** (`CATALOGUE_RUNS`, env `FC_RUNS` for a nightly run): about 9 s with coverage. 150 would pass 20 s.
5. **Speed guard is a normal test**, p95 of 15 runs under 500 ms (x3 when `COVERAGE_RUN=1`, set in `vitest.config.ts` because `pnpm test` always runs coverage). `generate-pattern.bench.ts` gives the numbers for `vitest bench`.
