/** Distances between points, segments and axis-aligned rectangles, used to keep labels clear of lines. */
import { distance, dot, lerp, sub, type Point } from "./point";

/** An axis-aligned rectangle, in mm. */
export interface Rect {
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
 * Shortest distance from a point to a straight segment.
 *
 * @param p - The point.
 * @param start - Segment start.
 * @param end - Segment end.
 * @returns Distance in mm (to the nearer end when the foot of the perpendicular falls outside).
 */
export function distancePointToSegment(p: Point, start: Point, end: Point): number {
  const along = sub(end, start);
  const lengthSq = dot(along, along);
  if (lengthSq === 0) return distance(p, start);
  const t = Math.min(1, Math.max(0, dot(sub(p, start), along) / lengthSq));
  return distance(p, lerp(start, end, t));
}

/**
 * The four corners of a rectangle, clockwise on a y-down sheet starting at the top-left.
 *
 * @param r - The rectangle.
 * @returns Four points.
 */
export function rectCorners(r: Rect): Point[] {
  return [
    { x: r.minX, y: r.minY },
    { x: r.maxX, y: r.minY },
    { x: r.maxX, y: r.maxY },
    { x: r.minX, y: r.maxY },
  ];
}

/**
 * True when a point lies inside or on the rectangle.
 *
 * @param r - The rectangle.
 * @param p - The point.
 * @returns Whether it is inside.
 */
export function rectContains(r: Rect, p: Point): boolean {
  return p.x >= r.minX && p.x <= r.maxX && p.y >= r.minY && p.y <= r.maxY;
}

/**
 * True when a segment touches the rectangle (an end inside, or a crossing of one side). Liang–Barsky clipping.
 *
 * @param r - The rectangle.
 * @param start - Segment start.
 * @param end - Segment end.
 * @returns Whether the segment and the rectangle share a point.
 */
export function segmentTouchesRect(r: Rect, start: Point, end: Point): boolean {
  const d = sub(end, start);
  const sides: readonly (readonly [number, number])[] = [
    [-d.x, start.x - r.minX],
    [d.x, r.maxX - start.x],
    [-d.y, start.y - r.minY],
    [d.y, r.maxY - start.y],
  ];
  let t0 = 0;
  let t1 = 1;
  for (const [p, q] of sides) {
    if (p === 0) {
      if (q < 0) return false;
    } else if (p < 0) {
      t0 = Math.max(t0, q / p);
    } else {
      t1 = Math.min(t1, q / p);
    }
  }
  return t0 <= t1;
}

/**
 * The point of a rectangle nearest to a point.
 *
 * @param r - The rectangle.
 * @param p - The point.
 * @returns The point itself when inside, else the nearest point on the border.
 */
function clampToRect(r: Rect, p: Point): Point {
  return { x: Math.min(r.maxX, Math.max(r.minX, p.x)), y: Math.min(r.maxY, Math.max(r.minY, p.y)) };
}

/**
 * Shortest distance from a segment to a rectangle.
 *
 * @param r - The rectangle.
 * @param start - Segment start.
 * @param end - Segment end.
 * @returns 0 when they touch, else the gap in mm.
 */
export function distanceSegmentToRect(r: Rect, start: Point, end: Point): number {
  if (segmentTouchesRect(r, start, end)) return 0;
  const fromCorners = rectCorners(r).map((c) => distancePointToSegment(c, start, end));
  return Math.min(...fromCorners, distance(start, clampToRect(r, start)), distance(end, clampToRect(r, end)));
}

/**
 * Shortest distance from a point to a polyline (open list of points).
 *
 * @param p - The point.
 * @param line - At least two points.
 * @returns Distance in mm.
 */
export function distancePointToPolyline(p: Point, line: readonly Point[]): number {
  return Math.min(...line.slice(1).map((b, i) => distancePointToSegment(p, line[i]!, b)));
}
