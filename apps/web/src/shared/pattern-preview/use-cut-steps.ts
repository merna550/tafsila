"use client";
/** Hook that works out the direct-cut steps of a design in the worker (issue #291); the engine geometry never loads in the page. */
import { useEffect, useRef, useState } from "react";
import type { CutPlan } from "./cut-plan-types";
import { createPreviewClient, type PreviewClient, type PreviewWorkerFactory } from "./preview-client";
import type { PreviewInput, PreviewWorkerError } from "./protocol";
import { createBrowserPreviewWorker } from "./use-pattern-preview";

/** What the direct-cut screen shows about the steps. */
export interface CutStepsState {
  /** `idle` without input, `running` while the worker draws, then `ready` or `error`. */
  readonly status: "idle" | "running" | "ready" | "error";
  /** The latest plan; kept while a newer one runs. */
  readonly plan?: CutPlan;
  /** Set when `status` is `error`. */
  readonly error?: PreviewWorkerError;
}

/** The state before anything ran. */
const IDLE: CutStepsState = { status: "idle" };

/**
 * Asks the worker for the steps of `input` at `curveStepMm`. The last request wins; the worker is stopped on unmount.
 *
 * @param input - Design, measurements and options, or `null` while they load. Memoise it.
 * @param curveStepMm - Gap between curve points, 20-30 mm.
 * @param createWorker - Worker factory, read once at mount; tests pass a fake.
 * @returns The state.
 */
export function useCutSteps(
  input: PreviewInput | null,
  curveStepMm: number,
  createWorker: PreviewWorkerFactory = createBrowserPreviewWorker,
): CutStepsState & { readonly retry: () => void } {
  const [state, setState] = useState<CutStepsState>(IDLE);
  const [attempt, setAttempt] = useState(0);
  const client = useRef<PreviewClient | null>(null);
  const factory = useRef(createWorker);

  useEffect(() => {
    const created = createPreviewClient(factory.current);
    client.current = created;
    return () => {
      created.dispose();
      client.current = null;
    };
  }, []);

  useEffect(() => {
    const active = client.current;
    if (!active || input === null) return;
    setState((previous) => ({ ...previous, status: "running" }));
    void active.runCutSteps(input, curveStepMm).then((outcome) => {
      if ("stale" in outcome) return;
      setState(
        outcome.ok ? { status: "ready", plan: outcome.plan } : { status: "error", error: outcome.error },
      );
    });
  }, [input, curveStepMm, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
