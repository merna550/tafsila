import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { createContainer } from "./container";

const fixedClock = { now: () => new Date("2026-10-07T10:00:00.000Z") };
const app = createApp(
  createContainer({
    clock: fixedClock,
    appInfo: { environment: "test", version: "1.2.3", gitSha: "abc123" },
  }),
);

describe("API", () => {
  it("GET /api/health reports status, environment, version, git SHA and time", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: "ok",
      environment: "test",
      version: "1.2.3",
      gitSha: "abc123",
      time: "2026-10-07T10:00:00.000Z",
    });
  });

  it("unknown routes return the standard bilingual 404 body", async () => {
    const res = await app.request("/api/does-not-exist");
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, string>;
    expect(body.code).toBe("NOT_FOUND");
    expect(body.message_ar).toBeTruthy();
    expect(body.message_en).toBe("route not found");
  });
});
