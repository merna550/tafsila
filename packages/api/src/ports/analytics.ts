/** Analytics port: server-side product events go through this interface; the event list lives in the shared schemas package. */
import type { AnalyticsEventName, AnalyticsProperties } from "@tafsila/schemas";

/** Records product events for an opaque user or anonymous visitor. */
export interface Analytics {
  /** Captures a typed event; properties are validated against the strict schema. */
  capture<E extends AnalyticsEventName>(
    distinctId: string,
    event: E,
    properties?: AnalyticsProperties<E>,
  ): void;
}
