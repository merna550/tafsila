/** Polygon helpers over sampled points (use `samplePath` for a path): signed area, bounding box, inside test. */
import type { Point } from "./point";

/** Axis-aligned bounding box, in mm. */
export interface BBox {
  /** Smallest x. */
  readonly minX: number;
  /** Smallest y. */
  readonly minY: number;
  /** Largest x. */
  readonly maxX: number;
  /** Largest y. */
  readonly maxY: number;
}

/**
 * Signed area by the shoelace formula. Positive when the points run anticlockwise in maths axes (y up),
 * which looks clockwise on the y-down pattern sheet. A repeated closing point is harmless.
 *
 * @param points - Polygon corners in order.
 * @returns Area in mm² (negative for the other direction, 0 for fewer than three points).
 * @example
 * signedArea([pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)]) // 1
 */
export function signedArea(points: readonly Point[]): number {
  let twiceArea = 0;
  points.forEach((p, i) => {
    const next = points[(i + 1) % points.length]!;
    twiceArea += p.x * next.y - next.x * p.y;
  });
  return twiceArea / 2;
}

/**
 * Smallest axis-aligned box containing all points (for nesting and quick overlap tests).
 *
 * @param points - At least one point.
 * @returns The box.
 */
export function bbox(points: readonly Point[]): BBox {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

/**
 * True when two boxes touch or overlap.
 *
 * @param a - First box.
 * @param b - Second box.
 * @returns Whether they overlap.
 */
export function bboxOverlap(a: BBox, b: BBox): boolean {
  return a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY;
}

/**
 * Even–odd test: is the point inside the polygon? Points exactly on an edge may go either way.
 *
 * @param point - The point to test.
 * @param polygon - Polygon corners in order (closing point optional).
 * @returns Whether the point is inside.
 */
export function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length]!;
    const crossesRay = a.y > point.y !== b.y > point.y;
    if (crossesRay && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  });
  return inside;
}
