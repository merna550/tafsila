/// <reference lib="webworker" />
/** Web Worker that drafts the pattern off the main thread; the only place the engine geometry is loaded in the browser (issue #239). */
import { buildPatternScene, generatePattern } from "@tafsila/engine";
import { toWorkerError } from "./worker-error";
import type { PreviewRequest, PreviewResponse } from "./protocol";

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
    return {
      id: request.id,
      ok: true,
      result,
      scene: buildPatternScene(result),
      durationMs: performance.now() - started,
    };
  } catch (error) {
    return { id: request.id, ok: false, error: toWorkerError(error) };
  }
}

self.onmessage = (event: MessageEvent<PreviewRequest>): void => {
  self.postMessage(draft(event.data));
};
