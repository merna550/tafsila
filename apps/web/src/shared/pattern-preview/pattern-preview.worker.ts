/// <reference lib="webworker" />
/** Web Worker that drafts the pattern off the main thread; the only place the engine geometry is loaded in the browser (issue #239). */
import { DraftingError, INPUT_ERROR_MESSAGES, generatePattern, isInputError } from "@tafsila/engine";
import type { PreviewRequest, PreviewResponse, PreviewWorkerError } from "./protocol";

/**
 * Turns anything thrown by the engine into a message the page can route.
 *
 * @param error - The thrown value.
 * @returns A stable code, a log message and, for input errors, bilingual text.
 */
function toWorkerError(error: unknown): PreviewWorkerError {
  const message = error instanceof Error ? error.message : String(error);
  if (isInputError(error)) {
    const text = INPUT_ERROR_MESSAGES[error.code];
    return { code: error.code, message, messageAr: text.ar, messageEn: text.en };
  }
  return { code: error instanceof DraftingError ? error.code : "ENGINE_CRASH", message };
}

/**
 * Drafts one request.
 *
 * @param request - Spec, measurements and options with the request id.
 * @returns The result with the time it took, or the error.
 */
function draft(request: PreviewRequest): PreviewResponse {
  const started = performance.now();
  try {
    const result = generatePattern(request.spec, request.measurements, request.options);
    return { id: request.id, ok: true, result, durationMs: performance.now() - started };
  } catch (error) {
    return { id: request.id, ok: false, error: toWorkerError(error) };
  }
}

self.onmessage = (event: MessageEvent<PreviewRequest>): void => {
  self.postMessage(draft(event.data));
};
