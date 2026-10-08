import { describe, expect, it } from "vitest";
import { parseAnalyticsEvent } from "./analytics-events";

describe("analytics events", () => {
  it("accepts the known events", () => {
    expect(parseAnalyticsEvent("app_opened")).toEqual({});
    expect(parseAnalyticsEvent("signup_started", { source: "home" })).toEqual({ source: "home" });
  });

  it("rejects unknown events", () => {
    expect(() => parseAnalyticsEvent("page_viewed")).toThrow(/Unknown/);
  });

  it.each(["measurements", "bust", "waist", "phone", "email", "photo"])("rejects the %s field", (key) => {
    expect(() => parseAnalyticsEvent("app_opened", { [key]: "x" })).toThrow();
    expect(() => parseAnalyticsEvent("signup_started", { [key]: "x" })).toThrow();
  });

  it("rejects email and phone shaped values in any field", () => {
    expect(() => parseAnalyticsEvent("signup_started", { source: "a@b.com" })).toThrow();
    expect(() => parseAnalyticsEvent("signup_started", { source: "01012345678" })).toThrow();
  });
});
