/** Talks to the preview worker: sends requests and drops answers that a newer request replaced (issue #239). */
import type {
  CutStepsOutcome,
  PreviewInput,
  PreviewOutcome,
  WorkerRequest,
  WorkerResponse,
} from "./protocol";

/** The part of a Web Worker the client uses; tests pass a fake one. */
export interface PreviewWorker {
  /** Sends a request. */
  postMessage(request: WorkerRequest): void;
  /** Stops the worker. */
  terminate(): void;
  /** Called with each answer. */
  onmessage: ((event: { data: WorkerResponse }) => void) | null;
  /** Called when the worker cannot load or crashes outside a request. */
  onerror: ((event: unknown) => void) | null;
}

/** Creates a worker. */
export type PreviewWorkerFactory = () => PreviewWorker;

/** A running connection to one worker. */
export interface PreviewClient {
  /** Drafts one input; resolves `stale` when a newer `run` replaced it before the answer came. */
  run(input: PreviewInput): Promise<PreviewOutcome>;
  /** Works out the direct-cut steps of one input (issue #291); resolves `stale` when a newer request replaced it. */
  runCutSteps(input: PreviewInput, curveStepMm: number): Promise<CutStepsOutcome>;
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
  const pending = new Map<number, (outcome: PreviewOutcome | CutStepsOutcome) => void>();
  const kinds = new Map<number, "cut-steps" | "preview">();
  let latest = 0;

  /**
   * Sends one request and waits for its answer; any earlier waiting request is dropped.
   *
   * @param build - Makes the message from the new id.
   * @param kind - Which request it is, to shape a failure.
   * @returns The answer, or `stale`.
   */
  function send<T>(build: (id: number) => WorkerRequest, kind: "cut-steps" | "preview"): Promise<T> {
    dropPending();
    latest += 1;
    const id = latest;
    kinds.set(id, kind);
    return new Promise<T>((resolve) => {
      pending.set(id, resolve as (outcome: PreviewOutcome | CutStepsOutcome) => void);
      worker.postMessage(build(id));
    });
  }

  /** Resolves every waiting request as replaced. */
  function dropPending(): void {
    for (const [id, resolve] of pending) resolve({ id, stale: true });
    pending.clear();
    kinds.clear();
  }

  worker.onmessage = ({ data }): void => {
    const resolve = pending.get(data.id);
    if (!resolve) return;
    pending.delete(data.id);
    kinds.delete(data.id);
    resolve(data);
  };
  worker.onerror = (): void => {
    for (const [id, resolve] of pending) {
      const error = { code: "WORKER_FAILED", message: "The preview worker failed" };
      resolve(
        kinds.get(id) === "cut-steps"
          ? { id, kind: "cut-steps", ok: false, error }
          : { id, ok: false, error },
      );
    }
    pending.clear();
    kinds.clear();
  };

  return {
    run(input) {
      return send<PreviewOutcome>((id) => ({ ...input, id }), "preview");
    },
    runCutSteps(input, curveStepMm) {
      return send<CutStepsOutcome>((id) => ({ ...input, kind: "cut-steps", id, curveStepMm }), "cut-steps");
    },
    dispose() {
      dropPending();
      worker.terminate();
    },
  };
}
