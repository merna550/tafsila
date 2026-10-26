/** Messages between the page and the pattern preview worker: one source of types for both sides (issue #239). */
import type { PatternScene } from "@tafsila/engine/viewer";
import type { PatternResult } from "@tafsila/schemas";
import type { CutPlan } from "./cut-plan-types";

/** What the page asks the worker to draft. */
export interface PreviewInput {
  /** The design (validated by the engine). */
  readonly spec: unknown;
  /** Body measurements in mm. */
  readonly measurements: unknown;
  /** Engine options; the engine defaults apply when absent. */
  readonly options?: unknown;
}

/** A request posted to the worker. */
export interface PreviewRequest extends PreviewInput {
  /** Absent means a preview; older callers need not set it. */
  readonly kind?: "preview";
  /** Increasing id; the answer carries it back so late answers can be told apart. */
  readonly id: number;
}

/** Why a draft failed in the worker. */
export interface PreviewWorkerError {
  /** `DraftingError` code, or `ENGINE_CRASH` for anything else. */
  readonly code: string;
  /** Technical message for logs; never shown to the user. */
  readonly message: string;
  /** Arabic text when the code is a known input error. */
  readonly messageAr?: string;
  /** English text when the code is a known input error. */
  readonly messageEn?: string;
}

/** The worker's answer to one request. */
export type PreviewResponse =
  | {
      readonly id: number;
      readonly ok: true;
      readonly result: PatternResult;
      readonly scene: PatternScene;
      readonly durationMs: number;
    }
  | { readonly id: number; readonly ok: false; readonly error: PreviewWorkerError };

/** The answer `run` resolves with: a worker answer, or a mark that a newer request replaced this one. */
export type PreviewOutcome = PreviewResponse | { readonly id: number; readonly stale: true };

/** A request for the direct-cut steps of a design (issue #291). */
export interface CutStepsRequest extends PreviewInput {
  /** Tells the worker to run `cutSteps` after drafting. */
  readonly kind: "cut-steps";
  /** Increasing id, as for a preview. */
  readonly id: number;
  /** Gap between curve points, mm (20-30). */
  readonly curveStepMm: number;
}

/** Anything the page posts to the worker. */
export type WorkerRequest = PreviewRequest | CutStepsRequest;

/** The worker's answer to a {@link CutStepsRequest}. */
export type CutStepsResponse =
  | { readonly id: number; readonly kind: "cut-steps"; readonly ok: true; readonly plan: CutPlan }
  | {
      readonly id: number;
      readonly kind: "cut-steps";
      readonly ok: false;
      readonly error: PreviewWorkerError;
    };

/** Anything the worker posts back. */
export type WorkerResponse = PreviewResponse | CutStepsResponse;

/** What `runCutSteps` resolves with: the answer, or a mark that a newer request replaced this one. */
export type CutStepsOutcome = CutStepsResponse | { readonly id: number; readonly stale: true };
