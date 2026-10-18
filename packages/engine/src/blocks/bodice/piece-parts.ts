/** Parts shared by the back and front bodice pieces (issue #128): ids, cut, grain line, waist edge. */
import type { Piece, Point, Segment } from "@tafsila/schemas";
import { GRAIN_END_INSET_MM, GRAIN_FROM_CENTRE_MM } from "../../constants/bodice";
import { lineSeg, pt } from "../../geometry";

/** Id of the back bodice piece. */
export const BACK_PIECE_ID = "bodice-back";
/** Id of the front bodice piece. */
export const FRONT_PIECE_ID = "bodice-front";

/**
 * Cut info of a bodice half: one on the fold at the centre line (decision 128, 8; #143 turns the CB into a seam).
 *
 * @returns The cut info.
 */
export function bodiceCut(): Piece["cut"] {
  return { quantity: 1, onFold: true, mirror: false, fabric: "main" };
}

/**
 * Grain line parallel to the centre line, `GRAIN_FROM_CENTRE_MM` from it, inset from the neck and the waist.
 *
 * @param neckY - y of the neck on the centre line.
 * @param waistY - y of the waist on the centre line.
 * @returns The two grain line ends.
 */
export function grainLine(neckY: number, waistY: number): [Point, Point] {
  return [
    pt(GRAIN_FROM_CENTRE_MM, neckY + GRAIN_END_INSET_MM),
    pt(GRAIN_FROM_CENTRE_MM, waistY - GRAIN_END_INSET_MM),
  ];
}

/**
 * The waist edge from the side seam to the centre line: with a dart, side to first leg, the mouth, second leg
 * to the centre (3 lines); without, one line.
 *
 * @param side - Side waist point.
 * @param legs - Dart legs in path order.
 * @param centre - Waist point on the centre line.
 * @param hasDart - Whether the dart is drafted.
 * @returns The waist segments.
 */
export function waistEdge(
  side: Point,
  legs: readonly [Point, Point],
  centre: Point,
  hasDart: boolean,
): Segment[] {
  if (!hasDart) return [lineSeg(side, centre)];
  return [lineSeg(side, legs[0]), lineSeg(legs[0], legs[1]), lineSeg(legs[1], centre)];
}
