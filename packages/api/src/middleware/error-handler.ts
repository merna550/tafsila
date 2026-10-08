/** Maps any thrown error to the standard API error body { code, message_ar, message_en, request_id }. */
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError, HTTP_STATUS } from "../domain/errors";
import type { ErrorReporter } from "../ports/error-reporter";
import type { AppEnv } from "./request-id";

/** Standard error response body returned by every endpoint. */
export interface ApiErrorBody {
  /** Stable machine-readable code. */
  readonly code: string;
  /** Message for Arabic users. */
  readonly message_ar: string;
  /** Message for English users. */
  readonly message_en: string;
  /** Id of the failing request; users can read it out to support. */
  readonly request_id: string;
}

/**
 * Builds the Hono onError handler: known AppErrors keep their status and messages; anything else is
 * logged as one JSON line, reported through the ErrorReporter and becomes a 500 without leaking internals.
 *
 * @param reporter - Where unexpected errors are sent.
 * @returns The onError handler.
 */
export function createErrorHandler(reporter: ErrorReporter): (error: Error, c: Context<AppEnv>) => Response {
  return (error, c) => {
    const requestId = c.get("requestId");
    if (error instanceof AppError) {
      const body: ApiErrorBody = {
        code: error.code,
        message_ar: error.messageAr,
        message_en: error.messageEn,
        request_id: requestId,
      };
      return c.json(body, error.status as ContentfulStatusCode);
    }
    console.error(JSON.stringify({ level: "error", request_id: requestId, message: error.message }));
    reporter.captureException(error, { requestId });
    const body: ApiErrorBody = {
      code: "INTERNAL_ERROR",
      message_ar: "حدث خطأ غير متوقع، حاولي مرة أخرى",
      message_en: "Unexpected error, please try again",
      request_id: requestId,
    };
    return c.json(body, HTTP_STATUS.internal);
  };
}
