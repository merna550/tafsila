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

  it("accepts the phone events with fixed values only", () => {
    expect(parseAnalyticsEvent("phone_code_requested", { attempt: "resend" })).toEqual({ attempt: "resend" });
    expect(parseAnalyticsEvent("phone_verified", { trial_eligible: true })).toEqual({ trial_eligible: true });
    expect(parseAnalyticsEvent("phone_verification_failed", { reason: "rate_limited" })).toEqual({
      reason: "rate_limited",
    });
  });

  it("accepts the two browser events of the verify screen with fixed values only", () => {
    expect(parseAnalyticsEvent("phone_verify_viewed", {})).toEqual({});
    expect(parseAnalyticsEvent("phone_verify_skipped", { step: "code" })).toEqual({ step: "code" });
    expect(() => parseAnalyticsEvent("phone_verify_skipped", { step: "+201000000005" })).toThrow();
    expect(() => parseAnalyticsEvent("phone_verify_viewed", { phone: "+201000000005" })).toThrow();
  });

  it("rejects phone-shaped values and extra fields in the phone events", () => {
    expect(() => parseAnalyticsEvent("phone_code_requested", { attempt: "+201000000005" })).toThrow();
    expect(() => parseAnalyticsEvent("phone_verification_failed", { reason: "01000000005" })).toThrow();
    expect(() =>
      parseAnalyticsEvent("phone_verified", { trial_eligible: true, phone: "+201000000005" }),
    ).toThrow();
  });
});
