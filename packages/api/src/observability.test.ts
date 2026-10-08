import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import { createContainer, createObservability } from "./container";
import { chooseRequestId } from "./middleware/request-id";
import type { ErrorReporter } from "./ports/error-reporter";

/**
 * Builds an app for an environment with a fake reporter and a movable clock.
 *
 * @param environment - APP_ENV value the app reports.
 * @returns The app, the reporter spy and a clock advancer.
 */
function setup(environment: string) {
  const captureException = vi.fn();
  const errorReporter: ErrorReporter = { captureException, setUser: vi.fn() };
  let now = new Date("2026-10-07T10:00:00.000Z");
  const app = createApp(
    createContainer({
      clock: { now: () => now },
      appInfo: { environment, version: "1", gitSha: "abc" },
      errorReporter,
    }),
  );
  return { app, captureException, advance: (ms: number) => (now = new Date(now.getTime() + ms)) };
}

describe("request id", () => {
  it("generates an id and returns it in the header", async () => {
    const res = await setup("test").app.request("/api/health");
    expect(res.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("reuses a safe inbound id", async () => {
    const res = await setup("test").app.request("/api/health", {
      headers: { "x-request-id": "abc-123_X.y" },
    });
    expect(res.headers.get("x-request-id")).toBe("abc-123_X.y");
  });

  it("replaces over-long or non-printable inbound ids", () => {
    expect(chooseRequestId("a".repeat(65))).not.toBe("a".repeat(65));
    expect(chooseRequestId("bad id\n")).not.toBe("bad id\n");
    expect(chooseRequestId("")).toMatch(/^[0-9a-f-]{36}$/);
    expect(chooseRequestId(undefined)).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("error handler", () => {
  it("returns request_id in the body and reports unexpected errors once with it", async () => {
    const { app, captureException } = setup("staging");
    const res = await app.request("/api/debug/error", { headers: { "x-request-id": "req-1" } });
    expect(res.status).toBe(500);
    expect(res.headers.get("x-request-id")).toBe("req-1");
    expect(((await res.json()) as Record<string, string>).request_id).toBe("req-1");
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException.mock.calls[0]?.[1]).toEqual({ requestId: "req-1" });
  });

  it("does not report expected AppErrors but still adds request_id", async () => {
    const { app, captureException } = setup("staging");
    const res = await app.request("/api/nope");
    expect(res.status).toBe(404);
    expect(((await res.json()) as Record<string, string>).request_id).toBeTruthy();
    expect(captureException).not.toHaveBeenCalled();
  });
});

describe("debug route", () => {
  it("is 404 in production", async () => {
    const { app, captureException } = setup("production");
    expect((await app.request("/api/debug/error")).status).toBe(404);
    expect(captureException).not.toHaveBeenCalled();
  });

  it("answers 429 on the second call within a minute and works again after", async () => {
    const { app, advance } = setup("staging");
    expect((await app.request("/api/debug/error")).status).toBe(500);
    expect((await app.request("/api/debug/error")).status).toBe(429);
    advance(60_000);
    expect((await app.request("/api/debug/error")).status).toBe(500);
  });
});

describe("container observability", () => {
  it("uses no-op adapters without a DSN or key", () => {
    const { errorReporter, analytics } = createObservability({});
    expect(() => errorReporter.captureException(new Error("x"), { requestId: "r" })).not.toThrow();
    expect(() => analytics.capture("anon", "app_opened")).not.toThrow();
  });
});
