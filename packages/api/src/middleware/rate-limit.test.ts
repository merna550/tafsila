import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createErrorHandler } from "./error-handler";
import { createNoopErrorReporter } from "../adapters/noop/noop-error-reporter";
import { rateLimit } from "./rate-limit";
import type { AuthedEnv } from "./auth";
import { requestId } from "./request-id";

/**
 * An app whose only route is limited, with the user taken from the `x-user` header and a fake clock.
 *
 * @param limit - Requests per minute.
 * @returns The app and the clock.
 */
function setup(limit: number) {
  const clock = { ms: 0 };
  const app = new Hono<AuthedEnv>();
  app.use(requestId());
  app.use(async (c, next) => {
    c.set("auth", { userId: c.req.header("x-user") ?? "u", role: "user", claims: {} });
    await next();
  });
  app.use(rateLimit({ limit, windowMs: 60_000, now: () => clock.ms }));
  app.get("/", (c) => c.text("ok"));
  app.onError(createErrorHandler(createNoopErrorReporter()) as never);
  const hit = (user = "a") => app.request("/", { headers: { "x-user": user } });
  return { clock, hit };
}

describe("rateLimit", () => {
  it("allows the limit within a minute and refuses the next request with Retry-After", async () => {
    const { hit } = setup(5);
    for (let i = 0; i < 5; i += 1) expect((await hit()).status).toBe(200);
    const refused = await hit();
    expect(refused.status).toBe(429);
    expect(((await refused.json()) as { code: string }).code).toBe("RATE_LIMITED");
    expect(Number(refused.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("keeps a bucket per user", async () => {
    const { hit } = setup(1);
    expect((await hit("a")).status).toBe(200);
    expect((await hit("a")).status).toBe(429);
    expect((await hit("b")).status).toBe(200);
  });

  it("refills with time", async () => {
    const { hit, clock } = setup(5);
    for (let i = 0; i < 5; i += 1) await hit();
    expect((await hit()).status).toBe(429);
    clock.ms += 12_000;
    expect((await hit()).status).toBe(200);
    expect((await hit()).status).toBe(429);
    clock.ms += 60_000;
    for (let i = 0; i < 5; i += 1) expect((await hit()).status).toBe(200);
    expect((await hit()).status).toBe(429);
  });
});
