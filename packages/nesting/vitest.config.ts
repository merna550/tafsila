import { defineConfig } from "vitest/config";

/** Nesting tests; `test` enforces the 85% coverage floor of SRS NFR-10. */
export default defineConfig({
  test: {
    // The property tests draft five fixture designs in two sizes; with v8 coverage on shared CI runners they are slow.
    testTimeout: 60_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "scripts/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/test-support/**", "scripts/print.ts"],
      thresholds: { lines: 85, branches: 85, functions: 85 },
    },
  },
});
