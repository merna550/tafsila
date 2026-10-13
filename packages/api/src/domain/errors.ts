/** Domain errors: every code lives in ERROR_CATALOGUE with bilingual messages; the error handler maps them to HTTP (ADR-030). */

import type { MeasurementIssueDto } from "@tafsila/schemas";

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
  MEASUREMENTS_INVALID: {
    status: 422,
    messageAr: "القياسات غير منطقية، راجعي القياسات المحددة وحاولي مرة أخرى",
    messageEn: "The measurements are impossible, check the highlighted values",
  },
  NOT_FOUND: {
    status: 404,
    messageAr: "العنصر المطلوب غير موجود",
    messageEn: "Resource not found",
  },
  SIZE_CHART_NOT_FOUND: {
    status: 404,
    messageAr: "جدول المقاسات غير متاح حالياً",
    messageEn: "No default size chart is available",
  },
  AUTH_INVALID_CREDENTIALS: {
    status: 401,
    messageAr: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    messageEn: "The email or password is incorrect",
  },
  AUTH_EMAIL_NOT_CONFIRMED: {
    status: 401,
    messageAr: "لم يتم تأكيد البريد الإلكتروني بعد. يمكن فتح الرابط الذي وصل إلى البريد",
    messageEn: "The email is not confirmed yet. Open the link we sent to your inbox",
  },
  AUTH_EMAIL_TAKEN: {
    status: 409,
    messageAr: "هذا البريد الإلكتروني مسجّل بطريقة أخرى. يمكن تسجيل الدخول بحساب Google",
    messageEn: "This email is registered another way. Try signing in with Google",
  },
  AUTH_WEAK_PASSWORD: {
    status: 400,
    messageAr: "كلمة المرور قصيرة. يلزم 8 أحرف على الأقل",
    messageEn: "The password is too short. Use at least 8 characters",
  },
  AUTH_LINK_INVALID: {
    status: 400,
    messageAr: "الرابط غير صالح أو انتهت صلاحيته. يمكن طلب رابط جديد",
    messageEn: "The link is invalid or has expired. Request a new one",
  },
  PHONE_INVALID: {
    status: 400,
    messageAr: "رقم الهاتف غير صحيح. يُكتب رقم محمول مصري يبدأ بـ 010 أو 011 أو 012 أو 015",
    messageEn: "Enter an Egyptian mobile number starting with 010, 011, 012 or 015",
  },
  PHONE_TEST_ONLY: {
    status: 400,
    messageAr: "تُقبل أرقام الاختبار فقط في هذه البيئة",
    messageEn: "Only test numbers work in this environment",
  },
  PHONE_ALREADY_USED: {
    status: 409,
    messageAr: "هذا الرقم مستخدم في حساب آخر. لكل رقم تجربة مجانية واحدة",
    messageEn: "This number is used by another account. Each number gets one free trial",
  },
  PHONE_ALREADY_VERIFIED: {
    status: 409,
    messageAr: "رقم الهاتف مؤكَّد بالفعل",
    messageEn: "Your phone number is already verified",
  },
  PHONE_CODE_INVALID: {
    status: 400,
    messageAr: "رمز التأكيد غير صحيح أو انتهت صلاحيته",
    messageEn: "The code is wrong or has expired",
  },
  PHONE_RESEND_TOO_SOON: {
    status: 429,
    messageAr: "يمكن طلب رمز جديد بعد دقيقة",
    messageEn: "You can ask for a new code in a minute",
  },
  PHONE_TOO_MANY_ATTEMPTS: {
    status: 429,
    messageAr: "محاولات كثيرة. يمكن المحاولة مرة أخرى بعد قليل",
    messageEn: "Too many attempts. Try again later",
  },
  PHONE_SEND_FAILED: {
    status: 502,
    messageAr: "تعذّر إرسال الرمز. يمكن المحاولة مرة أخرى",
    messageEn: "We could not send the code. Try again",
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
  /** Bilingual measurement problems from the engine (MEASUREMENTS_INVALID), so the UI picks the language. */
  readonly issues?: readonly MeasurementIssueDto[];
  /** Seconds until the caller may try again (429 phone codes); also sent as the Retry-After header. */
  readonly retryAfterSeconds?: number;
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

/** Raised when measurements are impossible (engine errors); the set is not saved. */
export class MeasurementsInvalidError extends AppError {
  /**
   * Creates the error from the engine's blocking issues.
   *
   * @param issues - Blocking issues, both languages.
   */
  constructor(issues: readonly MeasurementIssueDto[]) {
    const fields: Record<string, string> = {};
    for (const issue of issues) for (const field of issue.fields) fields[field] ??= issue.message_en;
    super("MEASUREMENTS_INVALID", { details: { fields, issues } });
  }
}
