/** Talks to the preview worker: sends requests and drops answers that a newer request replaced (issue #239). */
import type { PreviewInput, PreviewOutcome, PreviewRequest, PreviewResponse } from "./protocol";

/** The part of a Web Worker the client uses; tests pass a fake one. */
export interface PreviewWorker {
  /** Sends a request. */
  postMessage(request: PreviewRequest): void;
  /** Stops the worker. */
  terminate(): void;
  /** Called with each answer. */
  onmessage: ((event: { data: PreviewResponse }) => void) | null;
  /** Called when the worker cannot load or crashes outside a request. */
  onerror: ((event: unknown) => void) | null;
}

/** Creates a worker. */
export type PreviewWorkerFactory = () => PreviewWorker;

/** A running connection to one worker. */
export interface PreviewClient {
  /** Drafts one input; resolves `stale` when a newer `run` replaced it before the answer came. */
  run(input: PreviewInput): Promise<PreviewOutcome>;
  /** Stops the worker; pending requests resolve as stale. */
  dispose(): void;
}

/**
 * Starts a worker and wraps it so the latest request wins.
 *
 * @param factory - Creates the worker.
 * @returns The client.
 */
export function createPreviewClient(factory: PreviewWorkerFactory): PreviewClient {
  const worker = factory();
  const pending = new Map<number, (outcome: PreviewOutcome) => void>();
  let latest = 0;

  /** Resolves every waiting request as replaced. */
  function dropPending(): void {
    for (const [id, resolve] of pending) resolve({ id, stale: true });
    pending.clear();
  }

  worker.onmessage = ({ data }): void => {
    const resolve = pending.get(data.id);
    if (!resolve) return;
    pending.delete(data.id);
    resolve(data);
  };
  worker.onerror = (): void => {
    for (const [id, resolve] of pending) {
      resolve({ id, ok: false, error: { code: "WORKER_FAILED", message: "The preview worker failed" } });
    }
    pending.clear();
  };

  return {
    run(input) {
      dropPending();
      latest += 1;
      const id = latest;
      return new Promise<PreviewOutcome>((resolve) => {
        pending.set(id, resolve);
        worker.postMessage({ ...input, id });
      });
    },
    dispose() {
      dropPending();
      worker.terminate();
    },
  };
}
