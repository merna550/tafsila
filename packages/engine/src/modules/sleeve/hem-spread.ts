/**
 * Hem fullness of the puff and bishop sleeves (issue #142, decision 142, 2): the hem is widened to the gathered width
 * with straight underarm seams from the underarm points, and dropped by a blouson allowance so the fullness falls over
 * the cuff. Aldrich 6th ed., ch. 2 (sleeve variations: fullness at the hem).
 */
import { lineSeg, pt } from "../../geometry";
import type { SleeveOutline } from "./outline";

/**
 * Spreads the hem of a sleeve outline.
 *
 * @param outline - The sleeve outline.
 * @param hemWidthMm - Hem width to reach; a hem already wider is kept.
 * @param dropMm - Blouson length added below the hem.
 * @returns The outline with the new tail.
 */
export function spreadHem(outline: SleeveOutline, hemWidthMm: number, dropMm: number): SleeveOutline {
  const [front, hem, back] = outline.tail;
  const halfMm = Math.max(hemWidthMm / 2, Math.abs(hem.from.x));
  const yMm = hem.from.y + dropMm;
  const hemFront = pt(halfMm, yMm);
  const hemBack = pt(-halfMm, yMm);
  return {
    ...outline,
    tail: [lineSeg(front.from, hemFront), lineSeg(hemFront, hemBack), lineSeg(hemBack, back.to)],
  };
}
