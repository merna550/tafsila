/** Decides where an ApiError is shown, so every screen reacts to the same error in the same place (ADR-030). */
import type { ApiError } from "./api-error";

/** Where the UI shows an error. */
export type ErrorPlacement =
  "field" | "toast" | "page-error-state" | "redirect-sign-in" | "no-permission" | "connection-banner";

/** What the user was doing when the error happened. */
export type ErrorContext = "load" | "action";

/**
 * Picks the display place for an error.
 *
 * Field validation goes under the field, 401 redirects to sign-in, 403 shows a permission message, offline shows
 * the connection banner; everything else is a page ErrorState when loading data and a toast when an action failed.
 *
 * @param error - The normalised error.
 * @param context - Whether a page was loading data or the user ran an action.
 * @returns The display place.
 */
export function placementFor(error: ApiError, context: ErrorContext): ErrorPlacement {
  if (error.kind === "validation" && Object.keys(error.fieldErrors).length > 0) return "field";
  if (error.kind === "unauthenticated") return "redirect-sign-in";
  if (error.kind === "forbidden") return "no-permission";
  if (error.kind === "network") return "connection-banner";
  return context === "load" ? "page-error-state" : "toast";
}

/**
 * Tells whether a "Try again" button makes sense for this error.
 *
 * @param error - The normalised error.
 * @returns True for failures that may succeed on retry.
 */
export function isRetryable(error: ApiError): boolean {
  return ["network", "timeout", "server", "rate-limited", "unknown"].includes(error.kind);
}

/**
 * Returns the reference the user can copy for unexpected errors.
 *
 * @param error - The normalised error.
 * @returns The request id for server and unknown errors, otherwise undefined.
 */
export function supportReference(error: ApiError): string | undefined {
  return error.kind === "server" || error.kind === "unknown" ? error.requestId : undefined;
}
