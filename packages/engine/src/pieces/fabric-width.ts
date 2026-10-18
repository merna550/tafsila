/** How wide a piece is across its grain line: what the fabric width must hold (FR-VAL-08, issues #133 and #136). */
import type { Piece } from "@tafsila/schemas";
import { GEOMETRY_EPSILON_MM } from "../constants/geometry";
import { samplePath } from "../geometry";

/** The piece fields needed to measure its width across the grain. */
export type GrainWidthPiece = Pick<Piece, "grainLine" | "cut"> & Partial<Pick<Piece, "cutPath">>;

/**
 * Measures a cutting path perpendicular to its grain line.
 *
 * @param piece - Finished piece to measure.
 * @returns Width across the grain in mm, doubled when cut on the fold; zero for a missing grain direction or cut path.
 */
export function widthAcrossGrainMm(piece: GrainWidthPiece): number {
  const [start, end] = piece.grainLine;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const grainLengthMm = Math.hypot(dx, dy);
  if (grainLengthMm <= GEOMETRY_EPSILON_MM || piece.cutPath === undefined) return 0;
  const projections = samplePath(piece.cutPath).map(
    (point) => (-dy * point.x + dx * point.y) / grainLengthMm,
  );
  const extentMm = Math.max(...projections) - Math.min(...projections);
  return piece.cut.onFold ? extentMm * 2 : extentMm;
}
