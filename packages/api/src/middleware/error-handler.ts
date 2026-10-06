/** Maps any thrown error to the standard API error body { code, message_ar, message_en }. */
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError, HTTP_STATUS } from "../domain/errors";

/** Standard error response body returned by every endpoint. */
export interface ApiErrorBody {
  /** Stable machine-readable code. */
  readonly code: string;
  /** Message for Arabic users. */
  readonly message_ar: string;
  /** Message for English users. */
  readonly message_en: string;
}

/**
 * Hono onError handler: known AppErrors keep their status and messages; anything else becomes a 500
 * without leaking internals.
 *
 * @param error - The thrown error.
 * @param c - Hono request context.
 * @returns JSON response with the standard error body.
 */
export function handleError(error: Error, c: Context): Response {
  if (error instanceof AppError) {
    const body: ApiErrorBody = { code: error.code, message_ar: error.messageAr, message_en: error.messageEn };
    return c.json(body, error.status as ContentfulStatusCode);
  }
  console.error(error);
  const body: ApiErrorBody = {
    code: "INTERNAL_ERROR",
    message_ar: "حدث خطأ غير متوقع، حاولي مرة أخرى",
    message_en: "Unexpected error, please try again",
  };
  return c.json(body, HTTP_STATUS.internal);
}
