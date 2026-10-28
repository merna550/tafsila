/** Turning a piece so its grain line runs along the selvedge (+x), and the small point maps the preparation uses. */
import { type Point, pt, rotateAbout } from "@tafsila/engine/geometry";

/** A pure map from one point to another. */
export type PointMap = (p: Point) => Point;

/** Origin of the turn to the selvedge. */
const ORIGIN = pt(0, 0);

/**
 * Direction of a grain line on the pattern sheet, from its first point to its second.
 *
 * @param grainLine - The piece's grain line.
 * @returns Angle in radians from +x.
 */
export function grainAngleRad(grainLine: readonly [Point, Point]): number {
  const [start, end] = grainLine;
  return Math.atan2(end.y - start.y, end.x - start.x);
}

/**
 * The map that turns a piece so its grain line points along +x, the selvedge (ADR-312 item 4: the 0° turn).
 *
 * @param grainLine - The piece's grain line.
 * @returns A rotation about the origin.
 */
export function toSelvedge(grainLine: readonly [Point, Point]): PointMap {
  const angleRad = -grainAngleRad(grainLine);
  return (p) => rotateAbout(p, ORIGIN, angleRad);
}

/**
 * Mirror image across a line along the selvedge (y → −y): the other piece of a mirrored pair, grain direction kept.
 *
 * @param p - A point.
 * @returns The mirrored point.
 */
export function mirrorAcrossGrain(p: Point): Point {
  return pt(p.x, -p.y);
}

/**
 * Moves points so their box starts at (0, 0).
 *
 * @param points - The points.
 * @returns A translation that brings the smallest x and y to zero.
 */
export function toOrigin(points: readonly Point[]): PointMap {
  const minX = Math.min(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  return (p) => pt(p.x - minX, p.y - minY);
}
