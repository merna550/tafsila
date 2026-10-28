/** Maps a nesting worker error to the shared error display (ADR-030/072); the browser-only codes are listed in docs/errors.md. */
import ar from "@messages/ar.json";
import en from "@messages/en.json";
import { ApiError } from "../api";
import { previewErrorToApiError } from "../pattern-preview/preview-error";
import type { PreviewWorkerError } from "../pattern-preview/protocol";

/** Bilingual text of the browser-only nesting codes, read from `messages/` so no technical text is shown. */
const FABRIC_ERRORS = {
  PATTERN_INVALID: { ar: ar.fabric.calc.errors.invalid, en: en.fabric.calc.errors.invalid },
  WORKER_FAILED: { ar: ar.fabric.calc.errors.failed, en: en.fabric.calc.errors.failed },
} as const;

/**
 * Builds the ApiError for a failed calculation. Engine input errors keep their own text; the nesting codes get a
 * short text; anything else is an unexpected client error.
 *
 * @param error - The error the worker posted.
 * @returns An ApiError for `routeError` and the calculator.
 */
export function fabricErrorToApiError(error: PreviewWorkerError): ApiError {
  if (error.code in FABRIC_ERRORS) {
    const text = FABRIC_ERRORS[error.code as keyof typeof FABRIC_ERRORS];
    const kind = error.code === "PATTERN_INVALID" ? "validation" : "unknown";
    return new ApiError({ code: error.code, kind, status: 0, messageAr: text.ar, messageEn: text.en });
  }
  return previewErrorToApiError(error);
}
