/** 2D geometry primitives used by every drafting step. Coordinates are in millimetres. */

/** A point on the pattern plane, in millimetres (x to the right, y downwards). */
export interface Point {
  /** Horizontal position in mm. */
  readonly x: number;
  /** Vertical position in mm (downwards). */
  readonly y: number;
}

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
 * Straight-line distance between two points.
 *
 * @param a - First point.
 * @param b - Second point.
 * @returns Distance in mm.
 */
export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
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
