/** Domain errors: business failures with bilingual messages, mapped to HTTP in one place (error-handler). */

/** HTTP status codes used by domain errors. */
export const HTTP_STATUS = { badRequest: 400, unauthorized: 401, notFound: 404, internal: 500 } as const;

/** Base class for expected business errors that the API reports to users. */
export class AppError extends Error {
  /**
   * Creates an application error.
   *
   * @param code - Stable machine-readable code, e.g. "NOT_FOUND".
   * @param status - HTTP status the error maps to.
   * @param messageAr - Message shown to Arabic users.
   * @param messageEn - Message shown to English users and in logs.
   */
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly messageAr: string,
    public readonly messageEn: string,
  ) {
    super(messageEn);
    this.name = "AppError";
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
    super("NOT_FOUND", HTTP_STATUS.notFound, "العنصر المطلوب غير موجود", `${resource} not found`);
  }
}
