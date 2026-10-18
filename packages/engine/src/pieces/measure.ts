/** Measuring helpers on drafted pieces (issue #128): edge lengths with or without darts closed, dart legs. */
import type { Dart, Edge, Piece, Segment } from "@tafsila/schemas";
import { distance, pathLength, segmentLength } from "../geometry";
import { dartMouthIndex } from "../blocks/shared/darts";

/** The parts of a piece the measuring helpers read; works on a `PieceDraft` too. */
export type MeasurablePiece = Pick<Piece, "stitchPath" | "edges" | "darts">;

/**
 * The edge with the given id.
 *
 * @param piece - The piece.
 * @param edgeId - Edge id.
 * @returns The edge, or undefined.
 */
function findEdge(piece: MeasurablePiece, edgeId: string): Edge | undefined {
  return piece.edges.find((e) => e.id === edgeId);
}

/**
 * The outline segments of one edge, in path order.
 *
 * @param piece - The piece.
 * @param edgeId - Edge id.
 * @returns The segments; empty when the piece has no such edge.
 */
export function edgeSegments(piece: MeasurablePiece, edgeId: string): Segment[] {
  const edge = findEdge(piece, edgeId);
  return edge ? piece.stitchPath.slice(edge.fromSegment, edge.toSegment + 1) : [];
}

/**
 * Length of one edge along the stitch line. With `closeDarts`, each dart mouth on the edge is left out, which
 * is the length the edge sews to once its darts are closed.
 *
 * @param piece - The piece.
 * @param edgeId - Edge id.
 * @param options - `closeDarts`: leave out the dart mouths.
 * @param options.closeDarts - Whether to leave out the dart mouths.
 * @returns The length in mm (0 for an unknown edge).
 */
export function edgeLengthMm(
  piece: MeasurablePiece,
  edgeId: string,
  options: { readonly closeDarts?: boolean } = {},
): number {
  const full = pathLength(edgeSegments(piece, edgeId));
  if (!options.closeDarts) return full;
  const dartIntakeMm = piece.darts
    .filter((dart) => dart.edgeId === edgeId)
    .reduce((sum, dart) => {
      const mouthIndex = dartMouthIndex(piece.stitchPath, dart);
      return sum + (mouthIndex >= 0 ? segmentLength(piece.stitchPath[mouthIndex]!) : distance(...dart.legs));
    }, 0);
  return full - dartIntakeMm;
}

/**
 * Lengths of the two legs of a dart, apex to each leg end.
 *
 * @param dart - The dart.
 * @returns The two lengths in mm, in leg order.
 */
export function dartLegLengthsMm(dart: Pick<Dart, "apex" | "legs">): [number, number] {
  return [distance(dart.apex, dart.legs[0]), distance(dart.apex, dart.legs[1])];
}
