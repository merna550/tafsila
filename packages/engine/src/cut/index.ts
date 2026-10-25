/**
 * Direct-cut marking steps (issue #284, FR-CUT-01, FR-CUT-02, ADR-281 item 5): every piece as numbered steps a tailor
 * follows with a ruler on the fabric. Pure and deterministic; the UI only shows them (#291, #292).
 */
import type { PatternResult } from "@tafsila/schemas";
import { CUT_CURVE_STEP_DEFAULT_MM, CUT_CURVE_STEP_MAX_MM, CUT_CURVE_STEP_MIN_MM } from "../constants/cut";
import { DraftingError } from "../errors/drafting-error";
import { pieceCutSteps } from "./steps";
import type { CutSteps } from "./types";

export * from "./types";
export { cutFrame, fromFrame, toFrame, type FramePosition } from "./frame";
export { pointLabel } from "./steps";
export { connectionCurve } from "./curve-points";

/** Options of {@link cutSteps}. */
export interface CutStepsOptions {
  /** Gap between the offset points of a curve, 20-30 mm (FR-CUT-02); 25 when left out. */
  readonly curveStepMm?: number;
}

/**
 * The marking steps of every piece of a pattern.
 *
 * @param result - The drafted pattern (a failed result has no pieces and gives none).
 * @param options - `curveStepMm`: gap between curve points.
 * @returns The steps per piece, with the engine version and the curve step used.
 * @throws {DraftingError} CUT_STEP_OUT_OF_RANGE when `curveStepMm` is outside 20-30 mm.
 * @example
 * cutSteps(generatePattern(seedDress, sizeM)).pieces[0].steps[0].key // "cut.reference.fold"
 */
export function cutSteps(
  result: Pick<PatternResult, "engineVersion" | "pieces">,
  options: CutStepsOptions = {},
): CutSteps {
  const curveStepMm = options.curveStepMm ?? CUT_CURVE_STEP_DEFAULT_MM;
  if (!(curveStepMm >= CUT_CURVE_STEP_MIN_MM && curveStepMm <= CUT_CURVE_STEP_MAX_MM)) {
    throw new DraftingError(
      "CUT_STEP_OUT_OF_RANGE",
      `Curve step ${curveStepMm} mm is outside ${CUT_CURVE_STEP_MIN_MM}-${CUT_CURVE_STEP_MAX_MM} mm`,
    );
  }
  return {
    engineVersion: result.engineVersion,
    curveStepMm,
    pieces: result.pieces.map((piece) => pieceCutSteps(piece, curveStepMm)),
  };
}
