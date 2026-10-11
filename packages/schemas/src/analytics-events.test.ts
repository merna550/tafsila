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

  it("accepts the sign-up page source and the method", () => {
    expect(parseAnalyticsEvent("signup_started", { source: "sign_up_page", method: "email" })).toEqual({
      source: "sign_up_page",
      method: "email",
    });
    expect(parseAnalyticsEvent("signup_completed", { method: "google" })).toEqual({ method: "google" });
  });

  it("rejects email-shaped or unknown values in signup_completed", () => {
    expect(() => parseAnalyticsEvent("signup_completed", { method: "a@b.com" })).toThrow();
    expect(() => parseAnalyticsEvent("signup_completed", { email: "a@b.com" })).toThrow();
    expect(() => parseAnalyticsEvent("signup_completed", { userId: "123" })).toThrow();
  });
});
