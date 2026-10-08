import { describe, expect, it } from "vitest";
import { scrubEvent } from "./scrub-event";

describe("scrubEvent", () => {
  it("keeps only the user id", () => {
    const event = scrubEvent({ user: { id: "u1", email: "a@b.c", phone: "010", ip_address: "ip" } });
    expect(event.user).toEqual({ id: "u1" });
  });

  it("drops the user when there is no id", () => {
    expect(scrubEvent({ user: { email: "a@b.c" } }).user).toBeUndefined();
  });

  it("removes bodies, cookies, headers and query strings from the request", () => {
    const event = scrubEvent({
      request: {
        url: "/api/x",
        method: "POST",
        data: { bust: 90 },
        cookies: { a: "b" },
        headers: { cookie: "x" },
        query_string: "a=1",
      },
    });
    expect(event.request).toEqual({ url: "/api/x", method: "POST" });
  });

  it("leaves events without user or request alone", () => {
    expect(scrubEvent({})).toEqual({});
  });
});

describe("SENTRY_PRIVACY_OPTIONS", () => {
  it("disables automatic collection of personal data and scrubs on send", async () => {
    const { SENTRY_PRIVACY_OPTIONS } = await import("./scrub-event");
    expect(SENTRY_PRIVACY_OPTIONS.dataCollection.userInfo).toBe(false);
    expect(SENTRY_PRIVACY_OPTIONS.dataCollection.cookies).toBe(false);
    expect(SENTRY_PRIVACY_OPTIONS.dataCollection.httpBodies).toEqual([]);
    expect(SENTRY_PRIVACY_OPTIONS.beforeSend({ user: { id: "u", email: "e" } }).user).toEqual({ id: "u" });
  });
});
