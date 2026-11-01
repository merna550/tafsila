import { defineConfig } from "vitest/config";

/** AI package tests (fake provider and AI SDK test models only, no network); 85% coverage floor of SRS NFR-10. */
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
