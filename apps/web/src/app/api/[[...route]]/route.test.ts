import type * as ApiModule from "@tafsila/api";
import { describe, expect, it, vi } from "vitest";

const created = vi.hoisted(() => ({ count: 0 }));

vi.mock("@tafsila/api", async (importActual) => {
  const actual = await importActual<typeof ApiModule>();
  return {
    ...actual,
    createApp: (...args: Parameters<typeof actual.createApp>) => {
      created.count += 1;
      return actual.createApp(...args);
    },
  };
});

/** Importing the API package transforms the whole API package on a cold cache, which can pass the 5 s default. */
const IMPORT_TIMEOUT_MS = 30_000;

describe("API route module", () => {
  it(
    "imports without building the app or reading runtime config (next build with [SENSITIVE] values)",
    async () => {
      vi.stubEnv("SUPABASE_URL", "[SENSITIVE]");
      vi.stubEnv("SENTRY_DSN", "[SENSITIVE]");
      vi.stubEnv("DATABASE_URL", "[SENSITIVE]");
      try {
        const route = await import("./route");
        expect(route.dynamic).toBe("force-dynamic");
        expect(typeof route.GET).toBe("function");
        expect(created.count).toBe(0);
      } finally {
        vi.unstubAllEnvs();
      }
    },
    IMPORT_TIMEOUT_MS,
  );
});
