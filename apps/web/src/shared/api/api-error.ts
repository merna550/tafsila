/** The one error type the web app sees: every failed API call becomes an ApiError (ADR-030). */
import type { ApiErrorBody } from "@tafsila/schemas";

/** UI language of a message. */
export type Locale = "ar" | "en";

/** What went wrong, grouped by how the UI reacts. */
export type ApiErrorKind =
  | "validation"
  | "unauthenticated"
  | "forbidden"
  | "not-found"
  | "rate-limited"
  | "network"
  | "timeout"
  | "server"
  | "unknown";

/** Arabic text for failures that never reach the server, so no technical text is shown. */
export const CLIENT_ERROR_MESSAGES = {
  network: {
    ar: "مفيش اتصال بالإنترنت، اتأكدي من الشبكة وحاولي تاني",
    en: "No internet connection, check your network",
  },
  timeout: {
    ar: "الطلب أخد وقت أطول من المتوقع، حاولي مرة أخرى",
    en: "The request took too long, please try again",
  },
  unknown: { ar: "حدث خطأ غير متوقع، حاولي مرة أخرى", en: "Unexpected error, please try again" },
} as const;

/** Fields of an ApiError. */
export interface ApiErrorInit {
  /** Stable code from docs/errors.md, or NETWORK_ERROR / TIMEOUT / UNKNOWN_ERROR for client-side failures. */
  readonly code: string;
  /** Reaction group. */
  readonly kind: ApiErrorKind;
  /** HTTP status; 0 when no response arrived. */
  readonly status: number;
  /** Arabic message. */
  readonly messageAr: string;
  /** English message. */
  readonly messageEn: string;
  /** Field path to message, for the FormField error slot. */
  readonly fieldErrors?: Readonly<Record<string, string>>;
  /** Request id the user can copy to support. */
  readonly requestId?: string;
}

/** A failed API call, already normalised: components read this and never a raw response. */
export class ApiError extends Error {
  public readonly code: string;
  public readonly kind: ApiErrorKind;
  public readonly status: number;
  public readonly messageAr: string;
  public readonly messageEn: string;
  public readonly fieldErrors: Readonly<Record<string, string>>;
  public readonly requestId?: string;

  /**
   * Creates an ApiError.
   *
   * @param init - All fields of the error.
   */
  constructor(init: ApiErrorInit) {
    super(init.messageEn);
    this.name = "ApiError";
    this.code = init.code;
    this.kind = init.kind;
    this.status = init.status;
    this.messageAr = init.messageAr;
    this.messageEn = init.messageEn;
    this.fieldErrors = init.fieldErrors ?? {};
    this.requestId = init.requestId;
  }

  /**
   * Returns the message in the user's language.
   *
   * @param locale - UI language.
   * @returns The localized message.
   */
  localizedMessage(locale: Locale): string {
    return locale === "ar" ? this.messageAr : this.messageEn;
  }
}

/** First HTTP status that means the server failed. */
const SERVER_ERROR_MIN_STATUS = 500;

/**
 * Maps an HTTP status to the reaction group.
 *
 * @param status - HTTP status of the failed response.
 * @returns The error kind.
 */
export function kindFromStatus(status: number): ApiErrorKind {
  const byStatus: Record<number, ApiErrorKind> = {
    400: "validation",
    401: "unauthenticated",
    403: "forbidden",
    404: "not-found",
    429: "rate-limited",
  };
  return byStatus[status] ?? (status >= SERVER_ERROR_MIN_STATUS ? "server" : "unknown");
}

/**
 * Builds an ApiError from a parsed server error body.
 *
 * @param body - The standard error body.
 * @param status - HTTP status of the response.
 * @returns The normalised error.
 */
export function apiErrorFromBody(body: ApiErrorBody, status: number): ApiError {
  return new ApiError({
    code: body.code,
    kind: kindFromStatus(status),
    status,
    messageAr: body.message_ar,
    messageEn: body.message_en,
    fieldErrors: body.details?.fields,
    requestId: body.request_id,
  });
}

/**
 * Builds an ApiError for a failure that has no server body (offline, timeout, unreadable response).
 *
 * @param kind - Which client-side failure happened.
 * @param status - HTTP status if a response arrived, otherwise 0.
 * @returns The normalised error with a fixed bilingual message.
 */
export function clientApiError(kind: "network" | "timeout" | "unknown", status = 0): ApiError {
  const message = CLIENT_ERROR_MESSAGES[kind];
  const code = { network: "NETWORK_ERROR", timeout: "TIMEOUT", unknown: "UNKNOWN_ERROR" }[kind];
  return new ApiError({ code, kind, status, messageAr: message.ar, messageEn: message.en });
}
