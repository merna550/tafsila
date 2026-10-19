/**
 * The frame of one half of a one-piece dress or a blouse (issue #144): its bodice pieces, waist points and the lower
 * half below the hip, with the front lower half dropped so both side seams have the same length (decision 144, 4).
 */
import type { Edge, Point } from "@tafsila/schemas";
import { ASSEMBLY_TRUING_MAX_STEPS, ASSEMBLY_TRUING_TOLERANCE_MM } from "../../constants/assembly";
import { DraftingError } from "../../errors/drafting-error";
import type { DraftContext, PieceDraft } from "../../pipeline/draft-context";
import { blouseLowerHalf, type LowerHalf, lowerSideMm, SIDE_EDGE_ID, skirtLowerHalf } from "./lower-half";
import type { GarmentHalf } from "./waist-seam";

/** Id of the waist edge of every bodice piece. */
export const WAIST_EDGE = "waist";

/** Centre edge id of each half. */
export const CENTRE_EDGE: Readonly<Record<GarmentHalf, string>> = { front: "cf", back: "cb" };

/** The bodice pieces of one half: the block half, or the two princess panels. */
export interface HalfPieces {
  /** The piece on the centre line (block or centre panel). */
  readonly centre: PieceDraft;
  /** The piece with the side seam (block or side panel; the same piece as `centre` for a block). */
  readonly side: PieceDraft;
}

/** Everything the pieces of one half are rebuilt from. */
export interface HalfFrame {
  /** Front or back. */
  readonly half: GarmentHalf;
  /** The bodice pieces. */
  readonly pieces: HalfPieces;
  /** Waist point on the centre line. */
  readonly waistCentre: Point;
  /** Side waist point, where the bodice side seam ends. */
  readonly sideWaist: Point;
  /** The outline below the hip line. */
  readonly lower: LowerHalf;
}

/**
 * An edge of a piece by id.
 *
 * @param piece - The piece.
 * @param id - Edge id.
 * @returns The edge.
 * @throws {DraftingError} ASSEMBLY_EDGE_MISSING when the piece has no such edge.
 */
export function edgeOf(piece: PieceDraft, id: string): Edge {
  const edge = piece.edges.find((e) => e.id === id);
  if (!edge) throw new DraftingError("ASSEMBLY_EDGE_MISSING", `${piece.id} has no ${id} edge`);
  return edge;
}

/**
 * The bodice pieces of a half.
 *
 * @param ctx - Context after the bodice modules.
 * @param half - Front or back.
 * @returns The pieces.
 * @throws {DraftingError} ASSEMBLY_BODICE_MISSING when the half has no bodice piece.
 */
function halfPieces(ctx: DraftContext, half: GarmentHalf): HalfPieces {
  /**
   * A piece by id.
   *
   * @param id - Piece id.
   * @returns The piece, or undefined.
   */
  const find = (id: string): PieceDraft | undefined => ctx.pieces.find((p) => p.id === id);
  const block = find(`bodice-${half}`);
  if (block) return { centre: block, side: block };
  const centre = find(`bodice-${half}-centre`);
  const side = find(`bodice-${half}-side`);
  if (!centre || !side) throw new DraftingError("ASSEMBLY_BODICE_MISSING", `No bodice ${half}`);
  return { centre, side };
}

/**
 * The lower half of a half for a given drop: the skirt's below the hip (a dress), or the blouse hip row.
 *
 * @param ctx - Current context.
 * @param half - Front or back.
 * @param waistCentre - Waist point on the centre line.
 * @param dropMm - Drop used to true the side seams.
 * @returns The lower half.
 */
function lowerFor(ctx: DraftContext, half: GarmentHalf, waistCentre: Point, dropMm: number): LowerHalf {
  const inputs = ctx.inputs!;
  if (ctx.spec.category === "blouse") {
    return blouseLowerHalf(waistCentre, inputs.hipDepthMm, inputs.hipQuarterMm, dropMm);
  }
  const skirt = ctx.pieces.find((p) => p.id === `skirt-${half}`);
  if (!skirt) throw new DraftingError("ASSEMBLY_SKIRT_MISSING", `No skirt-${half} to join`);
  return skirtLowerHalf(skirt, waistCentre, inputs.hipDepthMm, dropMm);
}

/**
 * The half's frame with a given drop.
 *
 * @param ctx - Current context.
 * @param half - Front or back.
 * @param dropMm - Drop of the lower half.
 * @returns The frame.
 */
function frameAt(ctx: DraftContext, half: GarmentHalf, dropMm: number): HalfFrame {
  const pieces = halfPieces(ctx, half);
  const centreEdge = edgeOf(pieces.centre, CENTRE_EDGE[half]);
  const waistCentre = pieces.centre.stitchPath[centreEdge.fromSegment]!.from;
  const sideWaist = pieces.side.stitchPath[edgeOf(pieces.side, WAIST_EDGE).fromSegment]!.from;
  edgeOf(pieces.side, SIDE_EDGE_ID);
  return { half, pieces, waistCentre, sideWaist, lower: lowerFor(ctx, half, waistCentre, dropMm) };
}

/**
 * Both frames: the back as drafted, the front lower half dropped until the side seams below the waist match. The
 * bodice side seams already match (#128), so the whole seams match. Fixed-point iteration; the seam grows almost 1:1
 * with the drop.
 *
 * @param ctx - Context after the bodice, skirt and sleeve modules.
 * @returns Front and back frames.
 */
export function halfFrames(ctx: DraftContext): Readonly<Record<GarmentHalf, HalfFrame>> {
  const back = frameAt(ctx, "back", 0);
  const backMm = lowerSideMm(back.sideWaist, back.lower);
  let dropMm = 0;
  let front = frameAt(ctx, "front", dropMm);
  for (let i = 0; i < ASSEMBLY_TRUING_MAX_STEPS; i += 1) {
    const gapMm = backMm - lowerSideMm(front.sideWaist, front.lower);
    if (Math.abs(gapMm) <= ASSEMBLY_TRUING_TOLERANCE_MM) break;
    dropMm += gapMm;
    front = frameAt(ctx, "front", dropMm);
  }
  return { front, back };
}
