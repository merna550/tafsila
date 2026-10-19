/** Maps any thrown error to the standard API error body { code, message_ar, message_en, details?, request_id } (ADR-030). */
import type { ApiErrorBody } from "@tafsila/schemas";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError, ERROR_CATALOGUE, type ErrorDetails } from "../domain/errors";
import type { ErrorReporter } from "../ports/error-reporter";
import type { AppEnv } from "./request-id";

/**
 * Copies the error details into the response shape (fields always, issues and report only when present).
 *
 * @param details - Details carried by the AppError.
 * @returns The `details` object of the error body.
 */
function errorDetailsBody(details: ErrorDetails): NonNullable<ApiErrorBody["details"]> {
  return {
    fields: { ...details.fields },
    ...(details.retryAfterSeconds === undefined ? {} : { retryAfterSeconds: details.retryAfterSeconds }),
    ...(details.report ? { report: details.report } : {}),
    ...(details.issues
      ? { issues: details.issues.map((issue) => ({ ...issue, fields: [...issue.fields] })) }
      : {}),
  };
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
        ...(error.details ? { details: errorDetailsBody(error.details) } : {}),
        request_id: requestId,
      };
      const retryAfter = error.details?.retryAfterSeconds;
      return c.json(
        body,
        error.status as ContentfulStatusCode,
        retryAfter === undefined ? undefined : { "Retry-After": String(retryAfter) },
      );
    }
    console.error(JSON.stringify({ level: "error", request_id: requestId, message: error.message }));
    reporter.captureException(error, { requestId });
    const { status, messageAr, messageEn } = ERROR_CATALOGUE.INTERNAL_ERROR;
    const body: ApiErrorBody = {
      code: "INTERNAL_ERROR",
      message_ar: messageAr,
      message_en: messageEn,
      request_id: requestId,
    };
    return c.json(body, status);
  };
}
