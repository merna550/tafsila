/**
 * 2D points and vectors used by every drafting step. Coordinates are in millimetres, x to the right, y downwards.
 * The `Point` type is the one from `@tafsila/schemas` (decision 124), so the engine and its output share one shape.
 */
import type { Point } from "@tafsila/schemas";
import { DIRECTION_EPSILON_MM, GEOMETRY_EPSILON_MM } from "../constants/geometry";
import { DraftingError } from "../errors/drafting-error";

export type { Point } from "@tafsila/schemas";

/**
 * Creates a point; keeps call sites short and readable.
 *
 * @param x - Horizontal position in mm.
 * @param y - Vertical position in mm.
 * @returns The point.
 */
export function pt(x: number, y: number): Point {
  return { x, y };
}

/**
 * Adds two vectors (or moves a point by a vector).
 *
 * @param a - First vector or point.
 * @param b - Vector to add.
 * @returns a + b.
 */
export function add(a: Point, b: Point): Point {
  return pt(a.x + b.x, a.y + b.y);
}

/**
 * Subtracts two points, giving the vector from b to a.
 *
 * @param a - End point.
 * @param b - Start point.
 * @returns a − b.
 */
export function sub(a: Point, b: Point): Point {
  return pt(a.x - b.x, a.y - b.y);
}

/**
 * Multiplies a vector by a number.
 *
 * @param v - The vector.
 * @param factor - Scale factor.
 * @returns v × factor.
 */
export function scale(v: Point, factor: number): Point {
  return pt(v.x * factor, v.y * factor);
}

/**
 * Dot product; zero when two vectors are perpendicular.
 *
 * @param a - First vector.
 * @param b - Second vector.
 * @returns a · b.
 */
export function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * 2D cross product (z of the 3D cross); zero when two vectors are parallel, its sign gives the turn direction.
 *
 * @param a - First vector.
 * @param b - Second vector.
 * @returns a.x·b.y − a.y·b.x.
 */
export function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

/**
 * Length of a vector.
 *
 * @param v - The vector.
 * @returns |v| in mm.
 */
export function norm(v: Point): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Straight-line distance between two points.
 *
 * @param a - First point.
 * @param b - Second point.
 * @returns Distance in mm.
 */
export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Math.sqrt over Math.hypot: hypot is several times slower and lengths here never overflow (#128).
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Unit vector in the direction of v.
 *
 * @param v - The vector.
 * @returns v / |v|.
 * @throws {DraftingError} GEOMETRY_DEGENERATE_SEGMENT when v has no direction (zero length).
 */
export function normalize(v: Point): Point {
  const length = norm(v);
  if (length < DIRECTION_EPSILON_MM) {
    throw new DraftingError(
      "GEOMETRY_DEGENERATE_SEGMENT",
      "Cannot take the direction of a zero-length vector",
    );
  }
  return scale(v, 1 / length);
}

/**
 * Left-hand perpendicular in maths axes, (−y, x); on the y-down pattern sheet it points to the right of travel.
 *
 * @param v - The vector.
 * @returns v turned by +90°.
 */
export function perpendicular(v: Point): Point {
  return pt(-v.y, v.x);
}

/**
 * Point a fraction t of the way from a to b.
 *
 * @param a - Start point (t = 0).
 * @param b - End point (t = 1).
 * @param t - Fraction along the line.
 * @returns The interpolated point.
 */
export function lerp(a: Point, b: Point, t: number): Point {
  return pt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
}

/**
 * Direction angle of a vector, measured from the +x axis towards +y.
 *
 * @param v - The vector.
 * @returns Angle in radians, in (−π, π].
 */
export function angleRad(v: Point): number {
  return Math.atan2(v.y, v.x);
}

/**
 * True when two points coincide within a tolerance.
 *
 * @param a - First point.
 * @param b - Second point.
 * @param toleranceMm - Largest distance still counted as equal; defaults to GEOMETRY_EPSILON_MM.
 * @returns Whether the points are the same.
 */
export function samePoint(a: Point, b: Point, toleranceMm: number = GEOMETRY_EPSILON_MM): boolean {
  return distance(a, b) <= toleranceMm;
}

/**
 * Rejects NaN and infinite coordinates before any maths runs on them.
 *
 * @param p - The point to check.
 * @throws {DraftingError} GEOMETRY_DEGENERATE_SEGMENT when a coordinate is not finite.
 */
export function assertFinitePoint(p: Point): void {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
    throw new DraftingError("GEOMETRY_DEGENERATE_SEGMENT", `Point (${p.x}, ${p.y}) is not finite`);
  }
}

/**
 * Total length of a polyline (sum of its segments); used to measure seams and curves.
 *
 * @param points - Ordered points of the polyline.
 * @returns Length in mm (0 for fewer than two points).
 */
export function polylineLength(points: readonly Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const previous = points.at(i - 1);
    const current = points.at(i);
    if (previous && current) total += distance(previous, current);
  }
  return total;
}
