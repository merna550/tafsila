/**
 * Where the bodice armholes are (issue #138): the darted block has one armhole per half, a princess bodice may
 * split it between the centre and the side panel. The sleeve (#134) sews to the parts in this order.
 */
import type { Piece } from "@tafsila/schemas";
import {
  ARMHOLE_EDGE_ID,
  BACK_CENTRE_PIECE_ID,
  BACK_PIECE_ID,
  BACK_SIDE_PIECE_ID,
  FRONT_CENTRE_PIECE_ID,
  FRONT_PIECE_ID,
  FRONT_SIDE_PIECE_ID,
} from "./piece-parts";

/** One half of the bodice. */
export type BodiceHalf = "front" | "back";

/** The armholes of both halves, as piece ids in sewing order from the shoulder tip to the underarm. */
export type BodiceArmholeParts = Readonly<Record<BodiceHalf, readonly string[]>>;

/** Pieces that can carry part of each armhole, in order from the shoulder tip to the underarm. */
const ARMHOLE_PIECE_ORDER: BodiceArmholeParts = {
  front: [FRONT_PIECE_ID, FRONT_CENTRE_PIECE_ID, FRONT_SIDE_PIECE_ID],
  back: [BACK_PIECE_ID, BACK_CENTRE_PIECE_ID, BACK_SIDE_PIECE_ID],
};

/** The armhole parts of the darted block: one piece per half. */
export const BLOCK_ARMHOLE_PARTS: BodiceArmholeParts = {
  front: [FRONT_PIECE_ID],
  back: [BACK_PIECE_ID],
};

/**
 * The pieces holding the armhole of one half, shoulder tip first.
 *
 * @param pieces - The pieces drafted so far.
 * @param half - Front or back.
 * @returns Ids of the pieces with an armhole edge, in sewing order; empty when the bodice is not drafted.
 */
export function armholePieceIds(pieces: readonly Pick<Piece, "id" | "edges">[], half: BodiceHalf): string[] {
  return ARMHOLE_PIECE_ORDER[half].filter((id) =>
    pieces.some((p) => p.id === id && p.edges.some((e) => e.id === ARMHOLE_EDGE_ID)),
  );
}

/**
 * The armhole parts of both halves.
 *
 * @param pieces - The pieces drafted so far.
 * @returns Both halves' armhole pieces, shoulder tip first.
 */
export function armholeParts(pieces: readonly Pick<Piece, "id" | "edges">[]): BodiceArmholeParts {
  return { front: armholePieceIds(pieces, "front"), back: armholePieceIds(pieces, "back") };
}
