/** Maps a preview worker error to the shared error display (ADR-030/072), so an engine failure is never a crash. */
import { ApiError, clientApiError } from "../api";
import type { PreviewWorkerError } from "./protocol";

/**
 * Builds the ApiError for a failed draft. Known input errors keep their own Arabic text and show in place;
 * anything else is an unexpected client error (reported to Sentry by the error display).
 *
 * @param error - The error the worker posted.
 * @returns An ApiError for `routeError` and `ApiErrorView`.
 */
export function previewErrorToApiError(error: PreviewWorkerError): ApiError {
  if (error.messageAr && error.messageEn) {
    return new ApiError({
      code: error.code,
      kind: "validation",
      status: 0,
      messageAr: error.messageAr,
      messageEn: error.messageEn,
    });
  }
  return clientApiError("unknown");
}
