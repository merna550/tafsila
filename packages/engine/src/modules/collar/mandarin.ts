/**
 * The mandarin collar (issue #141, decision 141, 8). Aldrich 6th ed., ch. 5, "Mandarin collar": a curved stand only,
 * cut twice (outer and inner) plus an interfacing, open where the closure is, its open top corner rounded, with the
 * button extension when the closure is CF buttons.
 */
import type { DesignSpec, EngineOptions } from "@tafsila/schemas";
import { MANDARIN_CF_RISE_MM, MANDARIN_END_RADIUS_MM, MANDARIN_HEIGHT_MM } from "../../constants/collar";
import type { PieceDraft } from "../../pipeline/draft-context";
import type { CollarHolders } from "./pieces";
import { standPieces, standShape } from "./stand";

/**
 * Builds the mandarin stand and its interfacing.
 *
 * @param holders - The bodice neck holders.
 * @param closure - The design's closure (CF or CB, checked by the combination rule).
 * @param options - Engine options, for the seam allowances.
 * @returns The two pieces.
 */
export function mandarinPieces(
  holders: CollarHolders,
  closure: DesignSpec["closure"],
  options: Pick<EngineOptions, "seamAllowance">,
): PieceDraft[] {
  const atFront = closure.position === "center-front";
  const ends = {
    opening: atFront ? ("cb-fold" as const) : ("cf-fold" as const),
    extension: atFront && closure.type === "buttons",
    endRadiusMm: MANDARIN_END_RADIUS_MM,
  };
  const shape = standShape(holders, MANDARIN_HEIGHT_MM, MANDARIN_CF_RISE_MM);
  return standPieces(shape, { holders, heightMm: MANDARIN_HEIGHT_MM, ends }, options);
}
