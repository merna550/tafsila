/** Analytics wrapper: the only file that imports posthog-js (enforced by dependency-cruiser). Never throws and does nothing without a key. */
import { parseAnalyticsEvent, type AnalyticsEventName, type AnalyticsProperties } from "@tafsila/schemas";
import type { PublicConfig } from "@tafsila/config";
import posthog from "posthog-js";

let started = false;
let appOpenedSent = false;

/**
 * Starts PostHog with privacy-first defaults: no cookie or localStorage, no autocapture, no session
 * recording and no person profiles until a user is identified (NFR-05; consent work lands in M8).
 * Safe to call many times; does nothing without a project key.
 *
 * @param config - Public runtime configuration (project key and host).
 */
export function initAnalytics(config: Pick<PublicConfig, "posthogKey" | "posthogHost">): void {
  if (started || !config.posthogKey) return;
  posthog.init(config.posthogKey, {
    api_host: config.posthogHost,
    persistence: "memory",
    autocapture: false,
    disable_session_recording: true,
    person_profiles: "identified_only",
    capture_pageview: false,
  });
  started = true;
}

/**
 * Sends a typed product event. Properties are validated against the strict schema, so measurements,
 * photos, phone and email cannot be attached. Failures are swallowed: analytics never breaks the app.
 *
 * @param event - Event name from the shared list.
 * @param properties - Event properties allowed by that event's schema.
 */
export function track<E extends AnalyticsEventName>(event: E, properties?: AnalyticsProperties<E>): void {
  if (!started) return;
  try {
    posthog.capture(event, parseAnalyticsEvent(event, properties ?? {}));
  } catch {
    // Analytics must never break the page.
  }
}

/** Sends `app_opened` once per page load, however many times the provider mounts. */
export function trackAppOpenedOnce(): void {
  if (appOpenedSent || !started) return;
  appOpenedSent = true;
  track("app_opened");
}

/**
 * Reads a feature flag; false when analytics is off or the flag is unknown.
 *
 * @param flag - Flag key, e.g. "signups_open".
 * @returns Whether the flag is on for this visitor.
 */
export function isFlagEnabled(flag: string): boolean {
  return started && posthog.isFeatureEnabled(flag) === true;
}

/**
 * Calls back when PostHog has loaded the feature flags.
 *
 * @param callback - Function to run on every flag update.
 * @returns Function that stops listening.
 */
export function onFlagsLoaded(callback: () => void): () => void {
  if (!started) return () => undefined;
  return posthog.onFeatureFlags(callback);
}

/** Resets the wrapper state between tests. */
export function resetAnalyticsForTests(): void {
  started = false;
  appOpenedSent = false;
}
