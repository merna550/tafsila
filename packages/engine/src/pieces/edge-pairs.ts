import type { Edge } from "@tafsila/schemas";
import type { PieceDraft } from "../pipeline/draft-context";

/** One seam: a piece edge that names its partner, with both references (FR-VAL-01). */
export interface EdgePair {
  /** The piece that carries the pairing. */
  readonly piece: PieceDraft;
  /** The edge that carries the pairing. */
  readonly edge: Edge;
  /** The partner edge reference, `piece/edge`. */
  readonly targetRef: string;
}

/**
 * Builds the reference of an edge, `piece/edge`, the format used by validation checks and sewing steps.
 *
 * @param pieceId - Piece id.
 * @param edgeId - Edge id.
 * @returns The reference.
 */
export function edgeRef(pieceId: string, edgeId: string): string {
  return `${pieceId}/${edgeId}`;
}

/**
 * Builds the order-free key of a seam, so both directions of one pairing give the same key.
 *
 * @param first - One edge reference.
 * @param second - The other edge reference.
 * @returns The key.
 */
export function pairKey(first: string, second: string): string {
  return [first, second].sort((a, b) => a.localeCompare(b, "en")).join("|");
}

/**
 * Lists each seam once (a self pair counts once), preferring the direction that carries an intended ease.
 *
 * @param pieces - The pieces to scan.
 * @returns The seams, sorted by the reference of the carrying edge.
 */
export function uniqueEdgePairs(pieces: readonly PieceDraft[]): EdgePair[] {
  const pairs = new Map<string, EdgePair>();
  for (const piece of pieces) {
    for (const edge of piece.edges) {
      if (!edge.pairsWith) continue;
      const targetRef = edgeRef(edge.pairsWith.pieceId, edge.pairsWith.edgeId);
      const key = pairKey(edgeRef(piece.id, edge.id), targetRef);
      const stored = pairs.get(key);
      if (
        !stored ||
        (stored.edge.pairsWith?.intendedEaseMm === undefined && edge.pairsWith.intendedEaseMm !== undefined)
      ) {
        pairs.set(key, { piece, edge, targetRef });
      }
    }
  }
  return [...pairs.values()].sort((a, b) =>
    edgeRef(a.piece.id, a.edge.id).localeCompare(edgeRef(b.piece.id, b.edge.id), "en"),
  );
}
