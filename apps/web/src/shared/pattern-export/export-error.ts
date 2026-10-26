/** Maps an export worker error to the shared error display (ADR-030/072); the browser-only codes are listed in docs/errors.md. */
import ar from "@messages/ar.json";
import en from "@messages/en.json";
import { ApiError } from "../api";
import { previewErrorToApiError } from "../pattern-preview/preview-error";
import type { PreviewWorkerError } from "../pattern-preview/protocol";

/** Bilingual text of the browser-only export codes, read from `messages/` so no technical text is shown. */
const EXPORT_ERRORS = {
  FONT_LOAD_FAILED: { ar: ar.patternExport.errors.font, en: en.patternExport.errors.font },
  PATTERN_INVALID: { ar: ar.patternExport.errors.invalid, en: en.patternExport.errors.invalid },
  PDF_BUILD_FAILED: { ar: ar.patternExport.errors.build, en: en.patternExport.errors.build },
  WORKER_FAILED: { ar: ar.patternExport.errors.build, en: en.patternExport.errors.build },
} as const;

/** Reaction group per code: a missing font is a connection problem, an invalid pattern is a validation problem. */
const KINDS = {
  FONT_LOAD_FAILED: "network",
  PATTERN_INVALID: "validation",
  PDF_BUILD_FAILED: "unknown",
  WORKER_FAILED: "unknown",
} as const;

/**
 * Builds the ApiError for a failed export. Engine input errors keep their own text; the export codes get
 * a short text with a retry; anything else is an unexpected client error.
 *
 * @param error - The error the worker posted.
 * @returns An ApiError for `routeError` and the dialog.
 */
export function exportErrorToApiError(error: PreviewWorkerError): ApiError {
  if (error.code in EXPORT_ERRORS) {
    const text = EXPORT_ERRORS[error.code as keyof typeof EXPORT_ERRORS];
    const kind = KINDS[error.code as keyof typeof KINDS];
    return new ApiError({ code: error.code, kind, status: 0, messageAr: text.ar, messageEn: text.en });
  }
  return previewErrorToApiError(error);
}
