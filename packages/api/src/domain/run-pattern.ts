/** Runs the pattern engine for the version routes: builds the engine options from the stored inputs, times the run and refuses `fail` reports (decision 236, item 4). */
import { ENGINE_VERSION, generatePattern } from "@tafsila/engine";
import type { DesignSpec, EaseProfile, Measurements, PatternResult } from "@tafsila/schemas";
import type { Clock } from "../ports/clock";
import { PatternInvalidError } from "./errors";

/** Everything the engine needs to draft one version, as stored on a version row. */
export interface PatternInputs {
  readonly spec: DesignSpec;
  readonly measurements: Measurements;
  readonly sizeLabel: string;
  readonly easeProfile: EaseProfile;
  /** Seam allowance, fabric width and the client label snapshot. */
  readonly options: Readonly<Record<string, unknown>>;
}

/** The outcome of one engine run. */
export interface PatternRun {
  readonly result: PatternResult;
  /** Wall time of the run in milliseconds. */
  readonly engineMs: number;
}

/** A run that was accepted for saving: the report is `pass` or `warn`. */
export interface SavablePatternRun extends PatternRun {
  readonly status: "pass" | "warn";
  readonly inputHash: string;
  readonly engineVersion: string;
}

/**
 * Drafts the pattern from stored inputs and times it. Never throws on bad input (the report says `fail`).
 *
 * @param clock - Time source for the timing.
 * @param inputs - Spec, measurements and options.
 * @returns The pattern result and the run time.
 */
export function regeneratePattern(clock: Clock, inputs: PatternInputs): PatternRun {
  const started = clock.now().getTime();
  const result = generatePattern(inputs.spec, inputs.measurements, {
    ...inputs.options,
    easeProfile: inputs.easeProfile,
    sizeLabel: inputs.sizeLabel,
  });
  return { result, engineMs: Math.max(0, clock.now().getTime() - started) };
}

/**
 * Drafts the pattern and accepts it only when the report is `pass` or `warn`.
 *
 * @param clock - Time source for the timing.
 * @param inputs - Spec, measurements and options.
 * @returns The run with the status, hash and engine version to store.
 * @throws {PatternInvalidError} When the report is `fail` (422, nothing may be saved).
 */
export function runPattern(clock: Clock, inputs: PatternInputs): SavablePatternRun {
  const run = regeneratePattern(clock, inputs);
  const status = run.result.validation.status;
  if (status === "fail") throw new PatternInvalidError(run.result.validation);
  return { ...run, status, inputHash: run.result.meta.createdFrom, engineVersion: run.result.engineVersion };
}

/**
 * Whether a stored version was made by another engine version than the running one.
 *
 * @param engineVersion - Version stored on the row.
 * @returns True when they differ.
 */
export function engineChanged(engineVersion: string): boolean {
  return engineVersion !== ENGINE_VERSION;
}
