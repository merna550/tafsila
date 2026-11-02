import { defineConfig } from "vitest/config";

/** Export tests; enforces the 85% coverage floor of SRS NFR-10, like the engine. */
export default defineConfig({
  test: {
    // The A4 PDF tests take about 5 s alone and longer when CI tests every package at once (issue #355).
    testTimeout: 60_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      thresholds: { lines: 85, branches: 85, functions: 85 },
    },
  },
});
