/** The single list of product analytics events. Strict schemas make it impossible to attach measurements, photos, phone or email (NFR-05). */
import { z } from "zod";

/** Event fired once when the app is opened in a browser. */
const appOpenedSchema = z.object({}).strict();

/** Event fired when a user starts signing up. */
const signupStartedSchema = z
  .object({
    source: z.enum(["home", "sign_up_page"]).optional(),
    method: z.enum(["email", "google"]).optional(),
  })
  .strict();

/** Event fired once when a new account lands on the dashboard after confirming (no email, no user id). */
const signupCompletedSchema = z.object({ method: z.enum(["email", "google"]).optional() }).strict();

/** Server event: a verification code was requested (first send or resend); never carries the number. */
const phoneCodeRequestedSchema = z.object({ attempt: z.enum(["first", "resend"]) }).strict();

/** Server event: the phone was verified; says only whether the free trial is still available. */
const phoneVerifiedSchema = z.object({ trial_eligible: z.boolean() }).strict();

/** Server event: a verification step failed, with a fixed reason (never the number or the code). */
const phoneVerificationFailedSchema = z
  .object({ reason: z.enum(["invalid_code", "already_used", "rate_limited", "send_failed"]) })
  .strict();

/** Browser event: the verify-phone screen was shown; no number, no code. */
const phoneVerifyViewedSchema = z.object({}).strict();

/** Browser event: the person left the verify-phone screen without verifying, from the number step or the code step. */
const phoneVerifySkippedSchema = z.object({ step: z.enum(["phone", "code"]) }).strict();

/** Server event: the account and its data were deleted; the distinct id is the opaque user id and nothing else is sent. */
const accountDeletedSchema = z.object({}).strict();

/** Server event: the person changed the app language in settings. */
const localeChangedSchema = z.object({ locale: z.enum(["ar", "en"]) }).strict();

/** Server event: a pattern version was saved or reused; only the category, the status and the engine time (never measurements). */
const patternVersionSavedSchema = z
  .object({
    category: z.string(),
    validation_status: z.enum(["pass", "warn"]),
    engine_ms: z.number().min(0),
    reused: z.boolean(),
  })
  .strict();

/** Browser event: a pattern file was made; only the kind and the page count, never the title, measurements or client (issue #289). */
const patternExportedSchema = z
  .object({ kind: z.enum(["a4", "a0", "svg"]), pages: z.number().int().min(0) })
  .strict();

/** Schema of the properties of each event, keyed by event name. */
export const ANALYTICS_EVENTS = {
  app_opened: appOpenedSchema,
  signup_started: signupStartedSchema,
  signup_completed: signupCompletedSchema,
  phone_code_requested: phoneCodeRequestedSchema,
  phone_verified: phoneVerifiedSchema,
  phone_verification_failed: phoneVerificationFailedSchema,
  phone_verify_viewed: phoneVerifyViewedSchema,
  phone_verify_skipped: phoneVerifySkippedSchema,
  account_deleted: accountDeletedSchema,
  locale_changed: localeChangedSchema,
  pattern_version_saved: patternVersionSavedSchema,
  pattern_exported: patternExportedSchema,
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
