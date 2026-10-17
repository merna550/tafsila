/** Geometry-based body-line measurements used by the circumference validator (FR-VAL-03). */
import type { BodyLine, Piece, Point } from "@tafsila/schemas";
import { GEOMETRY_EPSILON_MM } from "../constants/geometry";
import { intersectSegments, lineSeg, samplePath } from "../geometry";
import { edgeLengthMm } from "./measure";

/** The piece fields needed to measure a declared body line. */
export type BodyLinePiece = Pick<Piece, "cut" | "stitchPath" | "edges" | "darts">;

/**
 * Number of full-garment copies represented by one drafted piece.
 *
 * @param piece - Piece with cutting instructions.
 * @returns Two for a half cut on a fold, otherwise its cut quantity.
 */
export function bodyLineMultiplier(piece: Pick<Piece, "cut">): number {
  return piece.cut.onFold ? 2 : piece.cut.quantity;
}

/**
 * Keeps geometrically identical intersection points only once.
 *
 * @param points - Raw crossings, often duplicated at adjacent segment joints.
 * @returns Distinct points in x order.
 */
function distinctPoints(points: readonly Point[]): Point[] {
  return [...points]
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .filter((point, index, all) =>
      all
        .slice(0, index)
        .every((other) => Math.hypot(point.x - other.x, point.y - other.y) > GEOMETRY_EPSILON_MM),
    );
}

/**
 * Measures one declared body line from the piece geometry.
 *
 * @param piece - Drafted piece.
 * @param line - Edge-backed or horizontal body-line declaration.
 * @returns The line length in mm, or undefined when the declaration cannot be measured.
 */
export function bodyLineLengthMm(piece: BodyLinePiece, line: BodyLine): number | undefined {
  if (line.kind === "edge") {
    if (!piece.edges.some((edge) => edge.id === line.edgeId)) return undefined;
    return edgeLengthMm(piece, line.edgeId, { closeDarts: true });
  }
  const sampled = samplePath(piece.stitchPath);
  const xs = sampled.map((point) => point.x);
  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 1;
  const probe = lineSeg({ x: minX, y: line.atMm }, { x: maxX, y: line.atMm });
  const crossings = distinctPoints(
    piece.stitchPath.flatMap((segment) => intersectSegments(probe, segment).map((hit) => hit.point)),
  );
  if (crossings.length < 2) return undefined;
  return crossings.at(-1)!.x - crossings[0]!.x;
}
