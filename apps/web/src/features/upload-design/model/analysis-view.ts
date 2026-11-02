/** Pure rules of the analysing screen: when polling stops, when to say "taking longer" and which steps are done (FR-DES-02). */
import type { DesignAnalysisState } from "@tafsila/schemas";

/** Time between two status requests, in milliseconds. */
export const POLL_INTERVAL_MS = 2000;

/** After this long the screen says the analysis takes longer than usual, in milliseconds. */
export const SLOW_AFTER_MS = 45_000;

/** What the analysing screen shows. */
export type AnalysisPhase = "running" | "slow" | "failed" | "done";

/**
 * Tells whether polling should go on.
 *
 * @param state - The latest state, undefined before the first answer.
 * @returns False once the analysis is `done` or `failed`.
 */
export function shouldKeepPolling(state: DesignAnalysisState | undefined): boolean {
  return state === undefined || state.status === "pending" || state.status === "none";
}

/**
 * Maps the stored state and the waiting time to what the screen shows.
 *
 * @param state - The latest state, undefined before the first answer.
 * @param waitedMs - Time since the screen opened, in milliseconds.
 * @returns The phase to show.
 */
export function phaseOf(state: DesignAnalysisState | undefined, waitedMs: number): AnalysisPhase {
  if (state?.status === "done") return "done";
  if (state?.status === "failed") return "failed";
  return waitedMs >= SLOW_AFTER_MS ? "slow" : "running";
}
