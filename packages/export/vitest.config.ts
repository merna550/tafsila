import { defineConfig } from "vitest/config";

/** Export tests; enforces the 85% coverage floor of SRS NFR-10, like the engine. */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      thresholds: { lines: 85, branches: 85, functions: 85 },
    },
  },
});
