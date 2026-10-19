/**
 * Regeneration budget (issue #147, FR-PAT-04 / NFR-02): the p95 of a full default-registry run of the heaviest whole
 * garment stays under 500 ms. `vitest bench` cannot fail a build, so the same measurement is a normal test (see
 * generate-pattern.bench.ts). Peter-pan collar designs are slower than the budget and are not covered here until #233 is fixed.
 */
import { sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "./generate-pattern";

/** The FR-PAT-04 budget in ms for the code as shipped. */
const BUDGET_P95_MS = 500;
/** v8 coverage (always on in `pnpm test`) makes the code about 3x slower, so the guard allows that much more. */
const COVERAGE_FACTOR = 3;
/** Untimed runs first, so the JIT has compiled the drafting code. */
const WARM_UPS = 3;
/** Timed runs. */
const RUNS = 15;
/** Quantile of the budget. */
const QUANTILE = 0.95;
/** Wall-clock allowance for the whole test on a busy shared runner. */
const TEST_TIMEOUT_MS = 60_000;

/**
 * The p95 of a sample.
 *
 * @param samples - Durations in ms.
 * @returns The 95th percentile.
 */
function p95(samples: readonly number[]): number {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.ceil(QUANTILE * sorted.length) - 1]!;
}

describe("generatePattern speed", () => {
  it(
    "regenerates the dress with a half-circle skirt on size M with a p95 under the 500 ms budget",
    () => {
      const run = (): number => {
        const start = performance.now();
        generatePattern(vNeckHalfCircleDress, sizeM, DEFAULT_ENGINE_OPTIONS);
        return performance.now() - start;
      };
      for (let i = 0; i < WARM_UPS; i += 1) run();
      const measured = p95(Array.from({ length: RUNS }, run));
      const instrumented = process.env.COVERAGE_RUN === "1";
      expect(measured).toBeLessThan(instrumented ? BUDGET_P95_MS * COVERAGE_FACTOR : BUDGET_P95_MS);
    },
    TEST_TIMEOUT_MS,
  );
});
