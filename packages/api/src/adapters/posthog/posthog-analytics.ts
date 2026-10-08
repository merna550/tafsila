/** PostHog adapter for the Analytics port; the only API file that imports posthog-node. */
import { parseAnalyticsEvent } from "@tafsila/schemas";
import { PostHog } from "posthog-node";
import type { Analytics } from "../../ports/analytics";

/**
 * Creates the PostHog analytics adapter. Events are validated first, so a field outside the strict
 * schema (measurements, phone, email, photo) throws before anything is sent.
 *
 * @param key - PostHog project key.
 * @param host - PostHog ingestion host.
 * @returns Analytics backed by PostHog.
 */
export function createPosthogAnalytics(key: string, host: string): Analytics {
  const client = new PostHog(key, { host });
  return {
    capture(distinctId, event, properties) {
      const validated = parseAnalyticsEvent(event, properties ?? {});
      client.capture({ distinctId, event, properties: validated });
    },
  };
}
