/**
 * Fold to seam (issue #143, decision 143, 2): a piece cut on the fold along the opening becomes a mirrored pair with a
 * seam there, and a zip seam gets the wider `ZIP_SEAM_ALLOWANCE_MM` unless the user set that edge's allowance
 * (Aldrich 6th ed., ch. 2: zips are set into a 20 mm allowance).
 */
import type { Piece } from "@tafsila/schemas";
import { ZIP_SEAM_ALLOWANCE_MM } from "../../constants/closure";
import { FOLD_EDGE_KIND } from "../../constants/finishing";
import { withEdgeAllowance } from "../../pieces/edge-allowance";
import { type DraftContext, type PieceDraft, withPieces } from "../../pipeline/draft-context";

/** Edge kind of a centre line once it is a seam. */
export const CENTRE_SEAM_KIND = "other";

/**
 * Cut info of a piece once its fold is a seam: twice the copies, mirrored.
 *
 * @param cut - The cut info on the fold.
 * @returns The cut info of the mirrored pair.
 */
export function mirroredCut(cut: Piece["cut"]): Piece["cut"] {
  if (!cut.onFold) return cut;
  return { ...cut, quantity: cut.quantity * 2, onFold: false, mirror: true };
}

/**
 * Turns one fold edge into a seam. The shell's seam pairs with itself on the mirrored copy (FR-VAL-01); an
 * interfacing declares no pairs. An edge that is already a seam is kept.
 *
 * @param piece - The piece.
 * @param edgeId - The edge on the opening.
 * @param pairSelf - Whether the seam pairs with its mirrored copy.
 * @returns The new piece.
 */
export function foldToSeam(piece: PieceDraft, edgeId: string, pairSelf: boolean): PieceDraft {
  const edge = piece.edges.find((e) => e.id === edgeId);
  if (!edge || edge.kind !== FOLD_EDGE_KIND) return piece;
  const pairs =
    pairSelf && piece.cut.fabric !== "interfacing" ? { pairsWith: { pieceId: piece.id, edgeId } } : {};
  const edges = piece.edges.map((e) => (e.id === edgeId ? { ...e, kind: CENTRE_SEAM_KIND, ...pairs } : e));
  return { ...piece, edges, cut: mirroredCut(piece.cut) } as PieceDraft;
}

/**
 * Sets the zip seam allowance on edges through the engine's per-edge table, keeping any allowance the user chose.
 *
 * @param ctx - Current context.
 * @param refs - `pieceId/edgeId` keys of the zip seams.
 * @returns The context with the allowances set.
 */
export function withZipAllowance(ctx: DraftContext, refs: readonly string[]): DraftContext {
  return withEdgeAllowance(ctx, refs, ZIP_SEAM_ALLOWANCE_MM);
}

/**
 * Puts changed pieces back in their place and appends new ones, so the closure keeps the piece order.
 *
 * @param ctx - Current context.
 * @param pieces - Changed or new pieces.
 * @returns The new context.
 */
export function withPiecesInPlace(ctx: DraftContext, pieces: readonly PieceDraft[]): DraftContext {
  const byId = new Map(pieces.map((p) => [p.id, p]));
  const kept = ctx.pieces.map((p) => byId.get(p.id) ?? p);
  const added = pieces.filter((p) => !ctx.pieces.some((old) => old.id === p.id));
  return withPieces(ctx, [...kept, ...added]);
}
