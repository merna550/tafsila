import { beforeEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  isFeatureEnabled: vi.fn(),
  onFeatureFlags: vi.fn(() => () => undefined),
}));
vi.mock("posthog-js", () => ({ default: posthog }));

import { initAnalytics, isFlagEnabled, resetAnalyticsForTests, track, trackAppOpenedOnce } from "./analytics";

const config = { posthogKey: "phc_test", posthogHost: "https://us.i.posthog.com" };

describe("analytics wrapper", () => {
  beforeEach(() => {
    resetAnalyticsForTests();
    vi.clearAllMocks();
  });

  it("is a no-op without a key and never throws", () => {
    initAnalytics({ posthogKey: undefined, posthogHost: config.posthogHost });
    expect(() => track("app_opened")).not.toThrow();
    trackAppOpenedOnce();
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
    expect(isFlagEnabled("signups_open")).toBe(false);
  });

  it("starts PostHog with privacy defaults", () => {
    initAnalytics(config);
    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        persistence: "memory",
        autocapture: false,
        disable_session_recording: true,
        person_profiles: "identified_only",
      }),
    );
  });

  it("fires app_opened once however often it is requested", () => {
    initAnalytics(config);
    trackAppOpenedOnce();
    trackAppOpenedOnce();
    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith("app_opened", {});
  });

  it("swallows events that violate the schema instead of sending them", () => {
    initAnalytics(config);
    expect(() => track("signup_started", { phone: "010" } as never)).not.toThrow();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("reads feature flags through PostHog", () => {
    initAnalytics(config);
    posthog.isFeatureEnabled.mockReturnValue(true);
    expect(isFlagEnabled("signups_open")).toBe(true);
  });
});
