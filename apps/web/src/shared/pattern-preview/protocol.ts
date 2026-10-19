/** Messages between the page and the pattern preview worker: one source of types for both sides (issue #239). */
import type { PatternResult } from "@tafsila/schemas";

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
  | { readonly id: number; readonly ok: true; readonly result: PatternResult; readonly durationMs: number }
  | { readonly id: number; readonly ok: false; readonly error: PreviewWorkerError };

/** The answer `run` resolves with: a worker answer, or a mark that a newer request replaced this one. */
export type PreviewOutcome = PreviewResponse | { readonly id: number; readonly stale: true };
