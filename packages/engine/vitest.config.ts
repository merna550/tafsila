import { defineConfig } from "vitest/config";

/** Engine tests; `test:coverage` enforces the 85% coverage floor of SRS NFR-10 (decision 124). */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/test-utils/**"],
      thresholds: { lines: 85, branches: 85, functions: 85 },
    },
  },
});
