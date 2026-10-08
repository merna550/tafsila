/** The single list of product analytics events. Strict schemas make it impossible to attach measurements, photos, phone or email (NFR-05). */
import { z } from "zod";

/** Event fired once when the app is opened in a browser. */
const appOpenedSchema = z.object({}).strict();

/** Event fired when a user starts signing up. */
const signupStartedSchema = z.object({ source: z.enum(["home"]).optional() }).strict();

/** Schema of the properties of each event, keyed by event name. */
export const ANALYTICS_EVENTS = {
  app_opened: appOpenedSchema,
  signup_started: signupStartedSchema,
} as const;

/** Names of all known analytics events. */
export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;

/** Properties allowed for a given analytics event. */
export type AnalyticsProperties<E extends AnalyticsEventName> = z.input<(typeof ANALYTICS_EVENTS)[E]>;

/**
 * Validates an event and its properties against the typed list; throws on unknown events or extra fields.
 *
 * @param name - Event name.
 * @param properties - Event properties (must match the strict schema).
 * @returns The validated properties.
 * @throws {Error} When the event is unknown or carries a field outside its schema.
 */
export function parseAnalyticsEvent(name: string, properties: unknown = {}): Record<string, unknown> {
  if (!Object.hasOwn(ANALYTICS_EVENTS, name)) throw new Error(`Unknown analytics event: ${name}`);
  return ANALYTICS_EVENTS[name as AnalyticsEventName].parse(properties);
}
