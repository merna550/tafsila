/** Test helper: a fake preview worker the test answers by hand. */
import type { PatternResult } from "@tafsila/schemas";
import type { PreviewWorker } from "./preview-client";
import type { PreviewRequest, PreviewResponse } from "./protocol";

/** A fake worker that records requests and lets the test answer them. */
export interface FakeWorker extends PreviewWorker {
  /** Requests received so far. */
  readonly requests: PreviewRequest[];
  /** Whether `terminate` was called. */
  terminated: boolean;
  /** Delivers an answer as the real worker would. */
  answer(response: PreviewResponse): void;
}

/**
 * Creates a fake worker.
 *
 * @returns The fake.
 */
export function createFakeWorker(): FakeWorker {
  const worker: FakeWorker = {
    requests: [],
    terminated: false,
    onmessage: null,
    onerror: null,
    postMessage(request) {
      worker.requests.push(request);
    },
    terminate() {
      worker.terminated = true;
    },
    answer(response) {
      worker.onmessage?.({ data: response });
    },
  };
  return worker;
}

/**
 * Builds a minimal successful answer.
 *
 * @param id - The request id to answer.
 * @param hash - The input hash to put in the result.
 * @returns A success response.
 */
export function okResponse(id: number, hash = "hash"): PreviewResponse {
  const result = { meta: { createdFrom: hash }, pieces: [] } as unknown as PatternResult;
  return { id, ok: true, result, durationMs: 12 };
}
