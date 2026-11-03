/** The confirmation screen's local state and its pure steps: the spec, what is confirmed and the last rules notice (FR-DES-04, FR-DES-05). */
import { normalizeSpec, specOptions, type FeaturePath, type FeatureValue } from "@tafsila/engine/spec-rules";
import type { DesignAnalysisResult, DesignSpec } from "@tafsila/schemas";
import { rawFeatureEdit } from "@/features/design-picker";
import { lowConfidencePaths } from "./confidence";

/** What the screen keeps; local UI state, not server data. */
export interface ConfirmState {
  /** The spec being confirmed, starting from the AI's. */
  readonly spec: DesignSpec;
  /** Low-confidence features still waiting for the user. */
  readonly unconfirmed: ReadonlySet<FeaturePath>;
  /** The spec before the last change, for one undo. */
  readonly previous: DesignSpec | null;
  /** Features the rules changed on the last change. */
  readonly resetPaths: readonly FeaturePath[];
  /** True once the user changed or confirmed anything. */
  readonly touched: boolean;
}

/**
 * Starts from an analysis: only features below the threshold wait for the user.
 *
 * @param result - The analysis.
 * @returns The first state.
 */
export function initConfirmState(result: DesignAnalysisResult): ConfirmState {
  return {
    spec: result.spec,
    unconfirmed: new Set(lowConfidencePaths(result).filter((p) => p !== "category")),
    previous: null,
    resetPaths: [],
    touched: false,
  };
}

/**
 * Marks one feature "looks right".
 *
 * @param state - The state.
 * @param path - The feature.
 * @returns The next state.
 */
export function confirmFeature(state: ConfirmState, path: FeaturePath): ConfirmState {
  const unconfirmed = new Set(state.unconfirmed);
  unconfirmed.delete(path);
  return { ...state, unconfirmed, resetPaths: [], touched: true };
}

/**
 * Changes a feature through the engine's rules; choosing a value confirms that feature.
 *
 * @param state - The state.
 * @param path - The feature.
 * @param value - The new value (an array for pockets).
 * @returns The next state, with the features the rules corrected in `resetPaths`.
 */
export function changeFeature(
  state: ConfirmState,
  path: FeaturePath,
  value: FeatureValue | readonly string[],
): ConfirmState {
  const { spec, changed } = normalizeSpec(rawFeatureEdit(state.spec, path, value));
  const unconfirmed = new Set(state.unconfirmed);
  unconfirmed.delete(path);
  return { ...state, spec, unconfirmed, previous: state.spec, resetPaths: changed, touched: true };
}

/**
 * Goes back one change (the confirmation of that feature is not restored).
 *
 * @param state - The state.
 * @returns The state with the previous spec, or the same when there is nothing to undo.
 */
export function undoChange(state: ConfirmState): ConfirmState {
  if (state.previous === null) return state;
  return { ...state, spec: state.previous, previous: null, resetPaths: [] };
}

/**
 * Hides the rules notice.
 *
 * @param state - The state.
 * @returns The state without reset paths.
 */
export function dismissReset(state: ConfirmState): ConfirmState {
  return state.resetPaths.length === 0 ? state : { ...state, resetPaths: [] };
}

/**
 * Lists the features that still need the user and apply to the current design.
 *
 * @param state - The state.
 * @returns Paths in no particular order.
 */
export function remainingPaths(state: ConfirmState): FeaturePath[] {
  const options = specOptions(state.spec);
  return [...state.unconfirmed].filter((path) => options[path].applies);
}

/**
 * Tells whether the user may continue: no feature is waiting.
 *
 * @param state - The state.
 * @returns True when nothing is left to check.
 */
export function canContinue(state: ConfirmState): boolean {
  return remainingPaths(state).length === 0;
}
