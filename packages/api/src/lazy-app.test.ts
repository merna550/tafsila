import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import { createContainer } from "./container";
import { createLazyFetch } from "./lazy-app";

describe("createLazyFetch", () => {
  it("does not create the app until the first request, then reuses it", async () => {
    const create = vi.fn(() => ({ fetch: () => new Response("ok") }));
    const handler = createLazyFetch(create);
    expect(create).not.toHaveBeenCalled();
    await handler(new Request("https://x/a"));
    await handler(new Request("https://x/b"));
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("retries creation after a failure", async () => {
    let calls = 0;
    const handler = createLazyFetch(() => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
      return { fetch: () => new Response("ok") };
    });
    expect(() => handler(new Request("https://x/"))).toThrow("boom");
    expect((await handler(new Request("https://x/"))).status).toBe(200);
  });
});

describe("placeholder runtime config (Vercel Sensitive values)", () => {
  const placeholder = {
    SUPABASE_URL: "[SENSITIVE]",
    SENTRY_DSN: "[SENSITIVE]",
    DATABASE_URL: "[SENSITIVE]",
  };

  it("creating the app does not throw and a protected route answers the standard 500 body", async () => {
    vi.stubEnv("SUPABASE_URL", placeholder.SUPABASE_URL);
    vi.stubEnv("SENTRY_DSN", placeholder.SENTRY_DSN);
    vi.stubEnv("DATABASE_URL", placeholder.DATABASE_URL);
    try {
      const app = createApp(createContainer());
      const res = await app.request("/api/me", { headers: { authorization: "Bearer abc" } });
      expect(res.status).toBe(500);
      const body = (await res.json()) as Record<string, string>;
      expect(body.code).toBe("INTERNAL_ERROR");
      expect(body.request_id).toBeTruthy();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
