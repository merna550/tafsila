/**
 * Finishing sub-step: writes the partner of each paired notch on the other edge (FR-PAT-02, issue #131, decision 131).
 * A module puts a notch on one edge; the partner sits at the same distance from the shared end of the seam.
 */
import type { Edge, Notch } from "@tafsila/schemas";
import { DraftingError } from "../errors/drafting-error";
import { pathLength } from "../geometry";
import { type PieceDraft, type Step, withPieces } from "../pipeline/draft-context";

/**
 * Length of an edge along the stitch line.
 *
 * @param piece - The piece that owns the edge.
 * @param edge - The edge.
 * @returns Length in mm.
 */
export function edgeLengthMm(piece: PieceDraft, edge: Edge): number {
  return pathLength(piece.stitchPath.slice(edge.fromSegment, edge.toSegment + 1));
}

/**
 * Distance of the partner notch from the start of its own edge.
 *
 * @param atMm - Distance of the first notch from the start of its edge.
 * @param partnerLengthMm - Length of the partner edge.
 * @param reversed - True when the two edges run in opposite directions.
 * @returns Distance in mm, kept inside the edge.
 */
export function partnerAtMm(atMm: number, partnerLengthMm: number, reversed: boolean): number {
  const at = reversed ? partnerLengthMm - atMm : atMm;
  return Math.min(partnerLengthMm, Math.max(0, at));
}

/**
 * The partner notch of one notch, looked up on the piece and edge it points to.
 *
 * @param piece - The piece that owns the notch.
 * @param notch - The notch with a `pairsWith`.
 * @param pieces - All pieces.
 * @returns The partner piece id and the notch to add to it.
 * @throws {DraftingError} FINISHING_NOTCH_PARTNER_MISSING when the partner piece or edge does not exist.
 */
function partnerOf(
  piece: PieceDraft,
  notch: Notch,
  pieces: readonly PieceDraft[],
): { pieceId: string; notch: Notch } {
  const pair = notch.pairsWith!;
  const other = pieces.find((p) => p.id === pair.pieceId);
  const edge = other?.edges.find((e) => e.id === pair.edgeId);
  if (!other || !edge) {
    throw new DraftingError(
      "FINISHING_NOTCH_PARTNER_MISSING",
      `Notch ${piece.id}/${notch.id} pairs with ${pair.pieceId}/${pair.edgeId}, which does not exist`,
    );
  }
  const own = piece.edges.find((e) => e.id === notch.edgeId);
  const reversed = pair.reversed ?? own?.pairsWith?.reversed ?? false;
  const partner: Notch = {
    id: notch.id,
    edgeId: edge.id,
    atMm: partnerAtMm(notch.atMm, edgeLengthMm(other, edge), reversed),
    ...(notch.marks === undefined ? {} : { marks: notch.marks }),
    pairsWith: { pieceId: piece.id, edgeId: notch.edgeId, reversed },
  };
  return { pieceId: other.id, notch: partner };
}

/**
 * True when the list already holds a notch with the same id on the same edge.
 *
 * @param list - Notches to look through.
 * @param notch - The notch to look for.
 * @returns Whether it is there.
 */
function hasNotch(list: readonly Notch[], notch: Notch): boolean {
  return list.some((n) => n.id === notch.id && n.edgeId === notch.edgeId);
}

/**
 * Adds the missing partner notches. A partner a module already wrote (same id on the partner piece) is kept.
 *
 * @param pieces - All pieces after the modules.
 * @returns The pieces with every paired notch present on both edges.
 * @throws {DraftingError} FINISHING_NOTCH_PARTNER_MISSING when a partner edge does not exist.
 */
export function completeNotches(pieces: readonly PieceDraft[]): PieceDraft[] {
  const added = new Map<string, Notch[]>();
  for (const piece of pieces) {
    for (const notch of piece.notches.filter((n) => n.pairsWith)) {
      const { pieceId, notch: partner } = partnerOf(piece, notch, pieces);
      const target = pieces.find((p) => p.id === pieceId)!;
      const queued = added.get(pieceId) ?? [];
      if (!hasNotch(target.notches, partner) && !hasNotch(queued, partner))
        added.set(pieceId, [...queued, partner]);
    }
  }
  return pieces.map((p) => (added.has(p.id) ? { ...p, notches: [...p.notches, ...added.get(p.id)!] } : p));
}

/**
 * The notch step: every paired notch exists on both edges.
 *
 * @param ctx - Current context.
 * @returns The new context.
 */
export const notchStep: Step = (ctx) => withPieces(ctx, completeNotches(ctx.pieces));
