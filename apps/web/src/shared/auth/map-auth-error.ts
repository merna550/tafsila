/** Maps Supabase Auth errors to the app's ApiError by `error.code`, so components never see a raw Supabase error (ADR-030). */
import { ApiError, clientApiError } from "../api";

/** The part of a Supabase auth error that we read (AuthError has more). */
export interface SupabaseAuthErrorLike {
  /** Stable machine code, for example `over_request_rate_limit`. */
  readonly code?: string;
  /** HTTP status; 0 or undefined for a network failure. */
  readonly status?: number;
  /** Name of the error class, for example `AuthRetryableFetchError`. */
  readonly name?: string;
}

/** Supabase codes that mean "too many requests". */
const RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "over_sms_send_rate_limit",
]);
/** Supabase codes that mean the session is missing or expired. */
const SESSION_CODES = new Set([
  "session_expired",
  "session_not_found",
  "refresh_token_not_found",
  "refresh_token_already_used",
  "bad_jwt",
  "user_not_found",
]);

/** HTTP statuses used for the mapped errors. */
const STATUS = { RATE_LIMITED: 429, UNAUTHENTICATED: 401, INTERNAL_ERROR: 500 } as const;
const KIND = {
  RATE_LIMITED: "rate-limited",
  UNAUTHENTICATED: "unauthenticated",
  INTERNAL_ERROR: "server",
} as const;
/** Same texts as the API catalogue (packages/api domain/errors.ts); the web cannot import the API package. */
const TEXT = {
  RATE_LIMITED: { ar: "طلبات كتير، حاولي مرة أخرى بعد شوية", en: "Too many requests, retry later" },
  UNAUTHENTICATED: { ar: "انتهت الجلسة، سجّلي الدخول مرة أخرى", en: "Sign-in required or session expired" },
  INTERNAL_ERROR: { ar: "حدث خطأ غير متوقع، حاولي مرة أخرى", en: "Unexpected error, please try again" },
} as const;

/**
 * Builds the ApiError for one of the mapped catalogue codes.
 *
 * @param code - A code from the API error catalogue.
 * @returns The error with its bilingual text.
 */
function catalogueError(code: keyof typeof TEXT): ApiError {
  return new ApiError({
    code,
    kind: KIND[code],
    status: STATUS[code],
    messageAr: TEXT[code].ar,
    messageEn: TEXT[code].en,
  });
}

/**
 * Converts a Supabase auth error into an ApiError with a catalogue code.
 * Rate limits become RATE_LIMITED, lost sessions UNAUTHENTICATED, offline NETWORK_ERROR, anything else INTERNAL_ERROR.
 * Part C adds the sign-in specific codes (wrong password, unconfirmed email) next to these.
 *
 * @param error - The error returned or thrown by supabase-js.
 * @returns The normalised error.
 */
export function mapAuthError(error: SupabaseAuthErrorLike): ApiError {
  if (error.code !== undefined && RATE_LIMIT_CODES.has(error.code)) return catalogueError("RATE_LIMITED");
  if (error.code !== undefined && SESSION_CODES.has(error.code)) return catalogueError("UNAUTHENTICATED");
  if (error.name === "AuthRetryableFetchError" || error.status === 0) return clientApiError("network");
  return catalogueError("INTERNAL_ERROR");
}
