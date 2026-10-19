/**
 * Which pieces and edges a closure changes (issue #143, decision 143, 2), resolved by stable piece and edge ids, never
 * by path index. The shell chain runs top to bottom along the opening (bodice, then skirt or tiers); the facings on
 * the same centre line follow the shell from fold to seam.
 */
import type { Point } from "@tafsila/schemas";
import { DraftingError } from "../../errors/drafting-error";
import type { Half } from "../../pieces/seam-chain";
import { distance, normalize, sub } from "../../geometry";
import type { PieceDraft } from "../../pipeline/draft-context";

/**
 * Facings cut on the same centre line, with the edge on it (decision 143, 2). The traced and contour facings follow
 * their skirt (#140); the neck facings follow the bodice (#139).
 *
 * @param half - Front or back.
 * @returns Piece id and centre edge id pairs.
 */
export function centreFacings(half: Half): readonly { pieceId: string; edgeId: string }[] {
  return [
    { pieceId: `neck-facing-${half}`, edgeId: "fold" },
    { pieceId: `neck-facing-${half}-interfacing`, edgeId: "fold" },
    { pieceId: `waist-facing-${half}`, edgeId: "centre" },
    { pieceId: `waist-facing-interfacing-${half}`, edgeId: "centre" },
    { pieceId: `waistband-${half}`, edgeId: "centre" },
    { pieceId: `waistband-facing-${half}`, edgeId: "centre" },
    { pieceId: `waistband-interfacing-${half}`, edgeId: "centre" },
  ];
}

/** A straight edge as two end points, top end first (smaller y: the sheet's y runs down). */
export interface StraightEdge {
  /** Top end. */
  readonly top: Point;
  /** Bottom end. */
  readonly bottom: Point;
  /** True when the edge runs from its top end in path order. */
  readonly startsAtTop: boolean;
}

/**
 * The single straight segment of an edge, top end first.
 *
 * @param piece - The piece.
 * @param edgeId - The edge.
 * @returns Its ends.
 * @throws {DraftingError} CLOSURE_CENTRE_NOT_STRAIGHT when the edge is not one straight segment.
 */
export function straightEdge(piece: PieceDraft, edgeId: string): StraightEdge {
  const edge = piece.edges.find((e) => e.id === edgeId);
  const segment =
    edge && edge.fromSegment === edge.toSegment ? piece.stitchPath[edge.fromSegment] : undefined;
  if (!segment || segment.kind !== "line") {
    throw new DraftingError(
      "CLOSURE_CENTRE_NOT_STRAIGHT",
      `${piece.id}/${edgeId} is not one straight segment`,
    );
  }
  const startsAtTop = segment.from.y <= segment.to.y;
  return startsAtTop
    ? { top: segment.from, bottom: segment.to, startsAtTop }
    : { top: segment.to, bottom: segment.from, startsAtTop };
}

/**
 * Unit vector down a straight edge.
 *
 * @param edge - The edge.
 * @returns The direction from top to bottom.
 */
export function downAlong(edge: StraightEdge): Point {
  if (distance(edge.top, edge.bottom) === 0) return { x: 0, y: 1 };
  return normalize(sub(edge.bottom, edge.top));
}
