"use client";
/** Hook behind the fabric calculator: runs the nesting worker; the latest `run` wins and `cancel` stops it (issue #318). */
import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  createFabricClient,
  type FabricClient,
  type FabricJob,
  type FabricWorker,
  type FabricWorkerFactory,
} from "./fabric-client";
import { fabricErrorToApiError } from "./fabric-error";
import { fabricReducer, IDLE_FABRIC_STATE, type FabricState } from "./fabric-state";

/** What the hook returns. */
export interface FabricNesting {
  /** Where the calculation is. */
  readonly state: FabricState;
  /** Calculates a layout; a running one is replaced. */
  readonly run: (job: FabricJob) => void;
  /** Stops a running calculation and goes back to idle. */
  readonly cancel: () => void;
}

/**
 * Creates the real module worker; Next bundles it as its own chunk, so `@tafsila/nesting` loads only there.
 *
 * @returns The worker.
 */
export function createBrowserFabricWorker(): FabricWorker {
  return new Worker(new URL("./fabric-nesting.worker.ts", import.meta.url), {
    type: "module",
  }) as FabricWorker;
}

/**
 * Runs calculations in their own worker, created on the first `run` and terminated on unmount.
 *
 * @param createWorker - Worker factory, read once; tests pass a fake.
 * @returns The state and its actions.
 */
export function useFabricNesting(
  createWorker: FabricWorkerFactory = createBrowserFabricWorker,
): FabricNesting {
  const [state, dispatch] = useReducer(fabricReducer, IDLE_FABRIC_STATE);
  const factory = useRef(createWorker);
  const client = useRef<FabricClient | null>(null);

  useEffect(() => () => client.current?.dispose(), []);

  const run = useCallback((job: FabricJob): void => {
    client.current ??= createFabricClient(factory.current);
    dispatch({ type: "start" });
    void client.current
      .run(job, (progress) => dispatch({ type: "progress", progress }))
      .then((outcome) => {
        if ("stale" in outcome) return;
        if (!outcome.ok) {
          dispatch({ type: "fail", error: fabricErrorToApiError(outcome.error) });
          return;
        }
        dispatch({ type: "done", answer: outcome });
      });
  }, []);

  const cancel = useCallback((): void => {
    client.current?.cancel();
    dispatch({ type: "reset" });
  }, []);

  return { state, run, cancel };
}
