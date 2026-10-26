/// <reference lib="webworker" />
/** Web Worker that drafts the pattern off the main thread; the only place the engine geometry is loaded in the browser (issue #239). */
import { buildPatternScene, cutSteps, generatePattern } from "@tafsila/engine";
import { toCutPlan } from "./cut-plan";
import { toWorkerError } from "./worker-error";
import type {
  CutStepsRequest,
  CutStepsResponse,
  PreviewRequest,
  PreviewResponse,
  WorkerRequest,
} from "./protocol";

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

/**
 * Drafts one input and works out its direct-cut steps (issue #291).
 *
 * @param request - Spec, measurements, options and curve step with the request id.
 * @returns The plan, or the error.
 */
function cut(request: CutStepsRequest): CutStepsResponse {
  try {
    const result = generatePattern(request.spec, request.measurements, request.options);
    const steps = cutSteps(result, { curveStepMm: request.curveStepMm });
    return { id: request.id, kind: "cut-steps", ok: true, plan: toCutPlan(steps, result.pieces) };
  } catch (error) {
    return { id: request.id, kind: "cut-steps", ok: false, error: toWorkerError(error) };
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>): void => {
  const request = event.data;
  self.postMessage(request.kind === "cut-steps" ? cut(request) : draft(request));
};
