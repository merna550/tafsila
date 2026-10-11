/** Maps Supabase Auth errors to the app's ApiError by `error.code`, so components never see a raw Supabase error (ADR-030). */
import ar from "@messages/ar.json";
import en from "@messages/en.json";
import { ApiError, CLIENT_ERROR_MESSAGES, clientApiError } from "../api";

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

/** Supabase codes of the sign-in and sign-up cases the screens show under the form, with the catalogue code they become. */
const FORM_ERROR_BY_SUPABASE_CODE = {
  invalid_credentials: "AUTH_INVALID_CREDENTIALS",
  email_not_confirmed: "AUTH_EMAIL_NOT_CONFIRMED",
  email_exists: "AUTH_EMAIL_TAKEN",
  user_already_exists: "AUTH_EMAIL_TAKEN",
  identity_already_exists: "AUTH_EMAIL_TAKEN",
  weak_password: "AUTH_WEAK_PASSWORD",
  otp_expired: "AUTH_LINK_INVALID",
  flow_state_expired: "AUTH_LINK_INVALID",
  flow_state_not_found: "AUTH_LINK_INVALID",
} as const;

/** A catalogue code of the form errors. */
type FormErrorCode = (typeof FORM_ERROR_BY_SUPABASE_CODE)[keyof typeof FORM_ERROR_BY_SUPABASE_CODE];

/** HTTP status and bilingual text of each form error code (same wording as the API error catalogue). */
const FORM_ERRORS: Record<FormErrorCode, { status: number; ar: string; en: string }> = {
  AUTH_INVALID_CREDENTIALS: {
    status: 401,
    ar: ar.authErrors.invalidCredentials,
    en: en.authErrors.invalidCredentials,
  },
  AUTH_EMAIL_NOT_CONFIRMED: {
    status: 401,
    ar: ar.authErrors.emailNotConfirmed,
    en: en.authErrors.emailNotConfirmed,
  },
  AUTH_EMAIL_TAKEN: { status: 409, ar: ar.authErrors.emailTaken, en: en.authErrors.emailTaken },
  AUTH_WEAK_PASSWORD: { status: 400, ar: ar.authErrors.weakPassword, en: en.authErrors.weakPassword },
  AUTH_LINK_INVALID: { status: 400, ar: ar.authErrors.linkInvalid, en: en.authErrors.linkInvalid },
};

/** HTTP statuses used for the mapped errors. */
const STATUS = { RATE_LIMITED: 429, UNAUTHENTICATED: 401, INTERNAL_ERROR: 500 } as const;
const KIND = {
  RATE_LIMITED: "rate-limited",
  UNAUTHENTICATED: "unauthenticated",
  INTERNAL_ERROR: "server",
} as const;
/** Texts of the mapped catalogue codes, from `messages/`. */
const TEXT = {
  RATE_LIMITED: CLIENT_ERROR_MESSAGES.rateLimited,
  UNAUTHENTICATED: CLIENT_ERROR_MESSAGES.sessionExpired,
  INTERNAL_ERROR: CLIENT_ERROR_MESSAGES.unknown,
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
 * Builds the ApiError for a sign-in or sign-up case. It is a "validation" error with a `form` field message, so the
 * shared error display shows it under the form and never redirects to sign-in (a wrong password is not a lost session).
 *
 * @param code - One of the AUTH_* catalogue codes.
 * @returns The error with its bilingual text.
 */
function formError(code: FormErrorCode): ApiError {
  const { status, ar: messageAr, en: messageEn } = FORM_ERRORS[code];
  return new ApiError({
    code,
    kind: "validation",
    status,
    messageAr,
    messageEn,
    fieldErrors: { form: messageEn },
  });
}

/**
 * Converts a Supabase auth error into an ApiError with a catalogue code.
 * Sign-in and sign-up cases become AUTH_* codes, rate limits RATE_LIMITED, lost sessions UNAUTHENTICATED,
 * offline NETWORK_ERROR, anything else INTERNAL_ERROR.
 *
 * @param error - The error returned or thrown by supabase-js.
 * @returns The normalised error.
 */
export function mapAuthError(error: SupabaseAuthErrorLike): ApiError {
  const formCode =
    error.code === undefined
      ? undefined
      : FORM_ERROR_BY_SUPABASE_CODE[error.code as keyof typeof FORM_ERROR_BY_SUPABASE_CODE];
  if (formCode) return formError(formCode);
  if (error.code !== undefined && RATE_LIMIT_CODES.has(error.code)) return catalogueError("RATE_LIMITED");
  if (error.code !== undefined && SESSION_CODES.has(error.code)) return catalogueError("UNAUTHENTICATED");
  if (error.name === "AuthRetryableFetchError" || error.status === 0) return clientApiError("network");
  return catalogueError("INTERNAL_ERROR");
}
