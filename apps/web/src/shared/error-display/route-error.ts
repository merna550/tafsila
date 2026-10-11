/** Turns any thrown value into one display decision, so every screen reacts to an error in the same place (ADR-030). */
import {
  ApiError,
  clientApiError,
  isRetryable,
  placementFor,
  supportReference,
  type ErrorContext,
  type ErrorPlacement,
  type Locale,
} from "../api";
import { routing } from "../i18n/routing";

/** Where and how one error is shown. */
export interface ErrorRoute {
  /** The fixed place that shows it. */
  readonly place: ErrorPlacement;
  /** User-facing message in the chosen language; never technical text. */
  readonly message: string;
  /** Field path to message, for `FormField` (empty unless `place` is "field"). */
  readonly fieldErrors: Readonly<Record<string, string>>;
  /** Copyable reference for server and unknown errors. */
  readonly requestId?: string;
  /** Whether a "Try again" button makes sense. */
  readonly retryable: boolean;
  /** True when the error is unexpected and must go to Sentry. */
  readonly unexpected: boolean;
}

/**
 * Normalises anything thrown into an ApiError, hiding stacks and `TypeError` text.
 *
 * @param error - The thrown value.
 * @returns The error itself, or a generic unknown ApiError.
 */
export function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : clientApiError("unknown");
}

/**
 * Decides where an error is shown and with which text.
 *
 * @param error - The thrown value.
 * @param context - Whether a page was loading data or the user ran an action.
 * @param locale - Message language; defaults to Arabic.
 * @returns The display decision.
 */
export function routeError(
  error: unknown,
  context: ErrorContext,
  locale: Locale = routing.defaultLocale,
): ErrorRoute {
  const apiError = toApiError(error);
  return {
    place: placementFor(apiError, context),
    message: apiError.localizedMessage(locale),
    fieldErrors: apiError.fieldErrors,
    requestId: supportReference(apiError),
    retryable: isRetryable(apiError),
    unexpected: !(error instanceof ApiError) || apiError.kind === "server" || apiError.kind === "unknown",
  };
}

/**
 * Builds the sign-in address that returns to the same page afterwards; only same-site paths are kept.
 *
 * @param currentPath - Path (with query) the user was on.
 * @returns The sign-in path with a `next` parameter.
 */
export function signInUrl(currentPath: string): string {
  const safe = currentPath.startsWith("/") && !currentPath.startsWith("//") ? currentPath : "/";
  return `/sign-in?next=${encodeURIComponent(safe)}`;
}
