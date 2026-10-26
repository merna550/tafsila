/** Talks to the export worker: latest request wins, and cancel restarts the worker because a PDF build cannot be interrupted (issue #289). */
import type { ExportMessage, ExportOutcome, ExportProgress, ExportRequest } from "./protocol";

/** The part of a Web Worker the client uses; tests pass a fake one. */
export interface ExportWorker {
  /** Sends a request. */
  postMessage(request: ExportRequest): void;
  /** Stops the worker. */
  terminate(): void;
  /** Called with each message. */
  onmessage: ((event: { data: ExportMessage }) => void) | null;
  /** Called when the worker cannot load or crashes outside a request. */
  onerror: ((event: unknown) => void) | null;
}

/** Creates a worker. */
export type ExportWorkerFactory = () => ExportWorker;

/** A request without its id; the client numbers it. */
export type ExportJob = Omit<ExportRequest, "id">;

/** A running connection to the export worker. */
export interface ExportClient {
  /** Builds one file; resolves `stale` when a newer `run` or `cancel` replaced it. */
  run(job: ExportJob, onProgress: (progress: ExportProgress) => void): Promise<ExportOutcome>;
  /** Stops the running build (the worker is terminated) and resolves it as stale. */
  cancel(): void;
  /** Stops the worker for good. */
  dispose(): void;
}

/** A waiting request. */
interface Pending {
  readonly resolve: (outcome: ExportOutcome) => void;
  readonly onProgress: (progress: ExportProgress) => void;
}

/**
 * Wraps a lazily created worker.
 *
 * @param factory - Creates the worker; called on the first `run` and again after a cancel.
 * @returns The client.
 */
export function createExportClient(factory: ExportWorkerFactory): ExportClient {
  let worker: ExportWorker | null = null;
  let latest = 0;
  let pending: (Pending & { readonly id: number }) | null = null;

  /** Resolves the waiting request, if any, as replaced. */
  function dropPending(): void {
    pending?.resolve({ id: pending.id, stale: true });
    pending = null;
  }

  /** Terminates the worker so the next run starts a fresh one. */
  function killWorker(): void {
    worker?.terminate();
    worker = null;
  }

  /**
   * Starts the worker and wires its messages.
   *
   * @returns The new worker.
   */
  function startWorker(): ExportWorker {
    const created = factory();
    created.onmessage = ({ data }): void => {
      if (!pending || data.id !== pending.id) return;
      if ("progress" in data) {
        pending.onProgress(data.progress);
        return;
      }
      const { resolve } = pending;
      pending = null;
      resolve(data);
    };
    created.onerror = (): void => {
      if (!pending) return;
      const { id, resolve } = pending;
      pending = null;
      resolve({ id, ok: false, error: { code: "WORKER_FAILED", message: "The export worker failed" } });
      killWorker();
    };
    return created;
  }

  return {
    run(job, onProgress) {
      dropPending();
      latest += 1;
      const id = latest;
      worker ??= startWorker();
      const started = worker;
      return new Promise<ExportOutcome>((resolve) => {
        pending = { id, resolve, onProgress };
        started.postMessage({ ...job, id });
      });
    },
    cancel() {
      dropPending();
      killWorker();
    },
    dispose() {
      dropPending();
      killWorker();
    },
  };
}
