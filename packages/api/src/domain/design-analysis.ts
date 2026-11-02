/** Rules of the background analysis: which hints are supported and when a `pending` state counts as dead. No I/O. */
import {
  SUPPORTED_ANALYSIS_CATEGORIES,
  type DesignAnalysisState,
  type GarmentCategory,
} from "@tafsila/schemas";
import { AppError } from "./errors";

/** Minutes after which a `pending` analysis is dead. */
const MINUTES_TO_DEAD = 5;

/** Milliseconds in a minute. */
const MS_PER_MINUTE = 60_000;

/** A `pending` analysis older than this is treated as dead (the job crashed), so a new one may start (decision 340, 2). */
export const PENDING_ANALYSIS_TTL_MS = MINUTES_TO_DEAD * MS_PER_MINUTE;

/**
 * Checks the category hint of an analyse request (FR-DES-02).
 *
 * @param hint - What the user said the garment is, if anything.
 * @returns The supported category, or undefined when there is no hint.
 * @throws {AppError} CATEGORY_NOT_SUPPORTED for any other category ("coming soon").
 */
export function requireSupportedHint(hint: string | undefined): GarmentCategory | undefined {
  if (hint === undefined) return undefined;
  const supported = SUPPORTED_ANALYSIS_CATEGORIES.find((category) => category === hint.toLowerCase());
  if (!supported) throw new AppError("CATEGORY_NOT_SUPPORTED");
  return supported;
}

/**
 * Whether an analysis is still running: `pending` and younger than the time-to-live.
 *
 * @param state - The stored state, if any.
 * @param now - Current time.
 * @returns True when a new analysis must wait.
 */
export function isAnalysisRunning(state: DesignAnalysisState | null | undefined, now: Date): boolean {
  if (state?.status !== "pending" || state.startedAt === undefined) return false;
  return now.getTime() - new Date(state.startedAt).getTime() < PENDING_ANALYSIS_TTL_MS;
}
