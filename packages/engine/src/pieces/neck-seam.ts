/**
 * The bodice neck seam as the pieces hold it (issues #139, #141): which piece of each half holds the neck, and its
 * neck segments. Shared by the neckline module, which reshapes the neck, and the collar module, which sews to it.
 */
import type { Segment } from "@tafsila/schemas";
import { BACK_CENTRE_PIECE_ID, BACK_PIECE_ID, FRONT_CENTRE_PIECE_ID, FRONT_PIECE_ID } from "../blocks/bodice";
import { DraftingError } from "../errors/drafting-error";
import { pathLength } from "../geometry";
import type { PieceDraft } from "../pipeline/draft-context";
import { edgeSegments } from "./measure";

/** Id of the neck edge on every bodice piece that holds the neck. */
export const NECK_EDGE_ID = "neck";

/** Id of the shoulder edge. */
export const SHOULDER_EDGE_ID = "shoulder";

/** One half of the bodice neck. */
export type NeckHalf = "front" | "back";

/** Both halves, front first. */
export const NECK_HALVES: readonly NeckHalf[] = ["front", "back"];

/** Bodice pieces that can hold the neck of each half (the block half, or the princess centre panel). */
export const NECK_PIECE_IDS: Readonly<Record<NeckHalf, readonly string[]>> = {
  front: [FRONT_PIECE_ID, FRONT_CENTRE_PIECE_ID],
  back: [BACK_PIECE_ID, BACK_CENTRE_PIECE_ID],
};

/** The piece holding one half's neck, with the neck as drafted. */
export interface NeckHolder {
  /** The bodice piece. */
  readonly piece: PieceDraft;
  /** Neck segments, centre line to neck point. */
  readonly neck: readonly Segment[];
  /** Length of the neck along the stitch line, in mm. */
  readonly lengthMm: number;
}

/**
 * The piece holding the neck of one half.
 *
 * @param pieces - Pieces drafted so far.
 * @param half - Front or back.
 * @returns The piece.
 * @throws {DraftingError} PIPELINE_STEP_ORDER when no bodice piece holds the neck.
 */
export function neckPiece(pieces: readonly PieceDraft[], half: NeckHalf): PieceDraft {
  const piece = pieces.find(
    (p) => NECK_PIECE_IDS[half].includes(p.id) && p.edges.some((e) => e.id === NECK_EDGE_ID),
  );
  if (!piece) throw new DraftingError("PIPELINE_STEP_ORDER", "The neck seam needs the bodice block first");
  return piece;
}

/**
 * Both neck holders, each with its neck segments and length.
 *
 * @param pieces - Pieces drafted so far.
 * @returns The front and back holders.
 * @throws {DraftingError} PIPELINE_STEP_ORDER when a half has no neck.
 */
export function neckHolders(pieces: readonly PieceDraft[]): Readonly<Record<NeckHalf, NeckHolder>> {
  /**
   * One half's holder.
   *
   * @param half - Front or back.
   * @returns The holder.
   */
  const holder = (half: NeckHalf): NeckHolder => {
    const piece = neckPiece(pieces, half);
    const neck = edgeSegments(piece, NECK_EDGE_ID);
    return { piece, neck, lengthMm: pathLength(neck) };
  };
  return { front: holder("front"), back: holder("back") };
}
