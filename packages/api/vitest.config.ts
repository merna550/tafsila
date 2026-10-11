import { defineConfig } from "vitest/config";

/** Default unit run: adapter tests that need local Supabase (`*.db.test.ts`) run with `pnpm --filter @tafsila/api test:db`. */
export default defineConfig({ test: { exclude: ["**/node_modules/**", "**/*.db.test.ts"] } });
