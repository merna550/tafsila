/**
 * The self-tie belt (issue #145, decision 145, 4): a folded strip cut across the grain, split into the fewest equal
 * parts that fit the fabric width. Finished length is the waist plus ease plus a tie at each end; the joining ends of
 * consecutive parts pair with each other (FR-VAL-01). Aldrich 6th ed., ch. 2 "Belts and waistbands".
 */
import {
  BELT_GRAIN_HEIGHT_SHARE,
  BELT_TIE_LENGTH_MM,
  BELT_WAIST_EASE_MM,
  BELT_WIDTH_MM,
} from "../../constants/belt";
import { DraftingError } from "../../errors/drafting-error";
import { pt } from "../../geometry";
import { STRIP_END_EDGE_ID, STRIP_START_EDGE_ID, stripPiece } from "../../pieces/strip";
import { type DraftContext, type PieceDraft, withPieces } from "../../pipeline/draft-context";

/** Most parts a belt is split into before the fabric is judged too narrow. */
const MAX_BELT_PARTS = 12;

/** Id of the belt piece when it is cut whole. */
export const BELT_ID = "belt";

/**
 * Finished length of the belt: the waist, its ease and a tie at each end.
 *
 * @param waistMm - The waist measurement.
 * @returns Length in mm.
 */
export function beltLengthMm(waistMm: number): number {
  return waistMm + BELT_WAIST_EASE_MM + 2 * BELT_TIE_LENGTH_MM;
}

/**
 * The id of one part.
 *
 * @param index - 0-based part.
 * @param parts - Number of parts.
 * @returns `belt`, or `belt-1`…`belt-n`.
 */
export function beltPartId(index: number, parts: number): string {
  return parts === 1 ? BELT_ID : `${BELT_ID}-${index + 1}`;
}

/**
 * One belt part: a strip with its grain across it, and its ends paired with the next and the previous part.
 *
 * @param ctx - Context, for the seam allowances.
 * @param index - 0-based part.
 * @param parts - Number of parts.
 * @param partMm - Length of every part.
 * @returns The piece.
 */
function beltPart(ctx: DraftContext, index: number, parts: number, partMm: number): PieceDraft {
  const id = beltPartId(index, parts);
  const strip = stripPiece(
    {
      id,
      name:
        parts === 1
          ? { ar: "حزام", en: "Belt" }
          : { ar: `حزام (جزء ${index + 1} من ${parts})`, en: `Belt, part ${index + 1} of ${parts}` },
      runs: [{ lengthMm: partMm }],
      heightMm: 2 * BELT_WIDTH_MM,
      overlapMm: 0,
      loop: false,
      fabric: "main",
      paired: false,
    },
    ctx.options,
  );
  const next = index + 1 < parts ? beltPartId(index + 1, parts) : undefined;
  const previous = index > 0 ? beltPartId(index - 1, parts) : undefined;
  const edges = strip.edges.map((edge) => {
    if (edge.id === STRIP_END_EDGE_ID && next)
      return { ...edge, pairsWith: { pieceId: next, edgeId: STRIP_START_EDGE_ID, intendedEaseMm: 0 } };
    if (edge.id === STRIP_START_EDGE_ID && previous)
      return { ...edge, pairsWith: { pieceId: previous, edgeId: STRIP_END_EDGE_ID, intendedEaseMm: 0 } };
    return edge;
  });
  const grainLine: PieceDraft["grainLine"] = [
    pt(partMm / 2, 2 * BELT_WIDTH_MM * BELT_GRAIN_HEIGHT_SHARE.from),
    pt(partMm / 2, 2 * BELT_WIDTH_MM * BELT_GRAIN_HEIGHT_SHARE.to),
  ];
  return { ...strip, edges, grainLine };
}

/**
 * Drafts the belt.
 *
 * @param ctx - Context after the garment modules.
 * @returns The context with the belt parts.
 * @throws {DraftingError} BELT_FABRIC_TOO_NARROW when even the largest split does not fit the fabric.
 */
export function draftBelt(ctx: DraftContext): DraftContext {
  const lengthMm = beltLengthMm(ctx.measurements.waist);
  for (let parts = 1; parts <= MAX_BELT_PARTS; parts += 1) {
    const partMm = lengthMm / parts;
    const probe = beltPart(ctx, 0, parts, partMm);
    const allowances = probe.edges
      .filter((e) => e.id === STRIP_START_EDGE_ID || e.id === STRIP_END_EDGE_ID)
      .reduce((sum, e) => sum + e.seamAllowanceMm, 0);
    if (partMm + allowances <= ctx.options.fabricWidthMm) {
      const pieces = Array.from({ length: parts }, (_, i) => beltPart(ctx, i, parts, partMm));
      return withPieces(ctx, [...ctx.pieces, ...pieces]);
    }
  }
  throw new DraftingError(
    "BELT_FABRIC_TOO_NARROW",
    `The belt does not fit a ${ctx.options.fabricWidthMm} mm fabric`,
  );
}
