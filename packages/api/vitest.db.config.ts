import { defineConfig } from "vitest/config";

/** Adapter tests against local Supabase (needs `pnpm db:start` and DATABASE_URL with the api_app role). */
export default defineConfig({ test: { include: ["src/**/*.db.test.ts"], testTimeout: 20_000 } });
