/** What the calculator shows: one shape for a fresh calculation and for a saved one, plus the save body (issue #318). */
import type { FabricCalc, FabricCalcResult, FabricOptions, SaveFabricCalcInput } from "@tafsila/schemas";
import type { FabricAnswer, FabricDoesNotFit, FabricKind, MarkerScene } from "@/shared/fabric-nesting";

/** One fabric kind's line in the results. */
export interface KindLine {
  /** Which fabric. */
  readonly kind: FabricKind;
  /** Metres to buy; 0 when nothing could be placed. */
  readonly lengthM: number;
  /** The marker diagram, absent for a saved result that has not been redrawn. */
  readonly scene: MarkerScene | null;
}

/** The calculation as the screen shows it. */
export interface CalcView {
  /** The options it was made with. */
  readonly options: FabricOptions;
  /** One line per fabric kind that has pieces. */
  readonly kinds: readonly KindLine[];
  /** Pieces wider than the fabric. */
  readonly doesNotFit: readonly FabricDoesNotFit[];
  /** True when the open layout would hold what the folded one cannot. */
  readonly suggestOpen: boolean;
  /** The algorithm version of the calculation. */
  readonly nestingVersion: string;
}

/**
 * Builds the view of a fresh calculation.
 *
 * @param answer - What the worker answered.
 * @param options - The options it ran with.
 * @returns The view.
 */
export function viewOfAnswer(answer: FabricAnswer, options: FabricOptions): CalcView {
  return {
    options,
    kinds: answer.kinds.map((k) => ({ kind: k.kind, lengthM: k.lengthM, scene: k.scene })),
    doesNotFit: answer.doesNotFit,
    suggestOpen: answer.suggestOpen,
    nestingVersion: answer.nestingVersion,
  };
}

/**
 * Builds the view of a stored calculation; it has lengths but no drawing until it is recalculated.
 *
 * @param calc - The stored calculation.
 * @returns The view.
 */
export function viewOfSaved(calc: FabricCalc): CalcView {
  return {
    options: calc.options,
    kinds: calc.result.kinds.map((k) => ({ kind: k.kind, lengthM: k.lengthM, scene: null })),
    doesNotFit: [],
    suggestOpen: false,
    nestingVersion: calc.nestingVersion,
  };
}

/**
 * Tells whether a calculation is complete enough to save: every piece placed and every length positive.
 *
 * @param answer - What the worker answered.
 * @returns True when the API would accept it.
 */
export function isSavable(answer: FabricAnswer): boolean {
  return (
    answer.kinds.length > 0 && answer.doesNotFit.length === 0 && answer.kinds.every((k) => k.lengthM > 0)
  );
}

/**
 * Builds the body of `PUT /versions/:id/fabric`.
 *
 * @param answer - What the worker answered.
 * @param options - The options it ran with.
 * @returns The body, or null when the answer is incomplete (a piece did not fit).
 */
export function saveBodyOf(answer: FabricAnswer, options: FabricOptions): SaveFabricCalcInput | null {
  if (!isSavable(answer)) return null;
  const result: FabricCalcResult = {
    kinds: answer.kinds.map((k) => ({ kind: k.kind, lengthM: k.lengthM, placements: [...k.placements] })),
  };
  return { options, result, nestingVersion: answer.nestingVersion };
}
