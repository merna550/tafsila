/** Domain errors: every code lives in ERROR_CATALOGUE with bilingual messages; the error handler maps them to HTTP (ADR-030). */

/** One entry of the error catalogue: what the user sees and what the team needs to fix it. */
export interface ErrorDefinition {
  /** HTTP status the error maps to. */
  readonly status: number;
  /** Default message shown to Arabic users. */
  readonly messageAr: string;
  /** Default message shown to English users and written to logs. */
  readonly messageEn: string;
}

/**
 * The single list of error codes the API may return. Add a code here, then add its row to docs/errors.md;
 * the catalogue test fails when a thrown code is missing from either place.
 */
export const ERROR_CATALOGUE = {
  VALIDATION_FAILED: {
    status: 400,
    messageAr: "في بيانات غير صحيحة، راجعي الحقول وحاولي مرة أخرى",
    messageEn: "Some fields are invalid",
  },
  UNAUTHENTICATED: {
    status: 401,
    messageAr: "انتهت الجلسة، سجّلي الدخول مرة أخرى",
    messageEn: "Sign-in required or session expired",
  },
  FORBIDDEN: {
    status: 403,
    messageAr: "ليس لديك صلاحية لهذا الإجراء",
    messageEn: "You do not have permission for this action",
  },
  NOT_FOUND: {
    status: 404,
    messageAr: "العنصر المطلوب غير موجود",
    messageEn: "Resource not found",
  },
  RATE_LIMITED: {
    status: 429,
    messageAr: "طلبات كتير، حاولي مرة أخرى بعد شوية",
    messageEn: "Too many requests, retry later",
  },
  INTERNAL_ERROR: {
    status: 500,
    messageAr: "حدث خطأ غير متوقع، حاولي مرة أخرى",
    messageEn: "Unexpected error, please try again",
  },
} as const satisfies Record<string, ErrorDefinition>;

/** Every error code the API can return. */
export type ErrorCode = keyof typeof ERROR_CATALOGUE;

/** Extra data an error can carry; `fields` maps a field path to a message for the FormField error slot. */
export interface ErrorDetails {
  /** Field path (e.g. "chest_mm") to the message to show under that field. */
  readonly fields?: Readonly<Record<string, string>>;
}

/** Optional overrides when throwing an error. */
export interface AppErrorOptions {
  /** English message more specific than the catalogue default (logs and English users). */
  readonly messageEn?: string;
  /** Arabic message more specific than the catalogue default. */
  readonly messageAr?: string;
  /** Machine-readable extras, such as per-field validation messages. */
  readonly details?: ErrorDetails;
}

/** Base class for expected business errors that the API reports to users. */
export class AppError extends Error {
  /** HTTP status taken from the catalogue. */
  public readonly status: number;
  /** Message shown to Arabic users. */
  public readonly messageAr: string;
  /** Message shown to English users and in logs. */
  public readonly messageEn: string;
  /** Machine-readable extras, if any. */
  public readonly details?: ErrorDetails;

  /**
   * Creates an application error from a catalogue code.
   *
   * @param code - A key of ERROR_CATALOGUE.
   * @param options - Message overrides and details.
   */
  constructor(
    public readonly code: ErrorCode,
    options: AppErrorOptions = {},
  ) {
    const definition: ErrorDefinition = ERROR_CATALOGUE[code];
    super(options.messageEn ?? definition.messageEn);
    this.name = "AppError";
    this.status = definition.status;
    this.messageAr = options.messageAr ?? definition.messageAr;
    this.messageEn = options.messageEn ?? definition.messageEn;
    this.details = options.details;
  }
}

/** Raised when a requested resource does not exist or belongs to another user. */
export class NotFoundError extends AppError {
  /**
   * Creates a not-found error for a resource type.
   *
   * @param resource - Name of the resource, e.g. "route" or "design".
   */
  constructor(resource: string) {
    super("NOT_FOUND", { messageEn: `${resource} not found` });
  }
}

/** Raised when input fails validation; carries per-field messages for the form. */
export class ValidationError extends AppError {
  /**
   * Creates a validation error.
   *
   * @param fields - Field path to message, shown under each field.
   */
  constructor(fields: Readonly<Record<string, string>>) {
    super("VALIDATION_FAILED", { details: { fields } });
  }
}
