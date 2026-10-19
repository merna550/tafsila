import { defineConfig } from "vitest/config";

/** Engine tests; `test:coverage` enforces the 85% coverage floor of SRS NFR-10 (decision 124). */
export default defineConfig({
  test: {
    // Lets the speed guard (issue #147) allow for the slowdown of v8 coverage instrumentation.
    env: { COVERAGE_RUN: process.argv.includes("--coverage") ? "1" : "" },
    // Property tests over the size matrix run whole pipelines; with v8 coverage instrumentation on shared CI runners
    // they are several times slower than locally, so the default 5 s is too tight.
    testTimeout: 30_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "scripts/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/test-utils/**", "src/render/expect-svg-snapshot.ts"],
      thresholds: { lines: 85, branches: 85, functions: 85 },
    },
  },
});
