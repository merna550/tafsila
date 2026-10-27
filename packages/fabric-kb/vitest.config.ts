import { defineConfig } from "vitest/config";

/** Fabric knowledge base tests; `test` enforces the 85% coverage floor of SRS NFR-10. */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "scripts/**/*.ts"],
      exclude: ["src/**/*.test.ts", "scripts/print.ts"],
      thresholds: { lines: 85, branches: 85, functions: 85 },
    },
  },
});
