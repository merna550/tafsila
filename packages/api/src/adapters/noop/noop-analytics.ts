/** No-op analytics used when no PostHog key is configured. */
import type { Analytics } from "../../ports/analytics";

/**
 * Creates an analytics adapter that drops every event.
 *
 * @returns Analytics with no side effects.
 */
export function createNoopAnalytics(): Analytics {
  return { capture: () => undefined };
}
