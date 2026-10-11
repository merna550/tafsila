/** Vitest config for `@tafsila/ui`: unit tests only; Playwright visual specs in `e2e/` run with `pnpm test:visual`. */
import { defineConfig } from "vitest/config";

export default defineConfig({ test: { include: ["src/**/*.test.{ts,tsx}"] } });
