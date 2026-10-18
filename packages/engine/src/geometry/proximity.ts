/** Distances between points, segments and axis-aligned rectangles, used to keep labels clear of lines. */
import type { Point } from "./point";

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
  return distanceCoordinatesToSegment(p.x, p.y, start, end);
}

/**
 * Allocation-free point-to-segment distance used by the label grid's inner loop.
 *
 * @param px - Point x coordinate.
 * @param py - Point y coordinate.
 * @param start - Segment start.
 * @param end - Segment end.
 * @returns Distance in mm.
 */
function distanceCoordinatesToSegment(px: number, py: number, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.sqrt((px - start.x) ** 2 + (py - start.y) ** 2);
  const t = Math.min(1, Math.max(0, ((px - start.x) * dx + (py - start.y) * dy) / lengthSq));
  const offsetX = px - (start.x + t * dx);
  const offsetY = py - (start.y + t * dy);
  return Math.sqrt(offsetX * offsetX + offsetY * offsetY);
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
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const sides: readonly (readonly [number, number])[] = [
    [-dx, start.x - r.minX],
    [dx, r.maxX - start.x],
    [-dy, start.y - r.minY],
    [dy, r.maxY - start.y],
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
 * Allocation-free distance from a point to the nearest point of a rectangle.
 *
 * @param r - Rectangle.
 * @param p - Point.
 * @returns Distance in mm.
 */
function distancePointToRect(r: Rect, p: Point): number {
  const dx = Math.max(r.minX - p.x, 0, p.x - r.maxX);
  const dy = Math.max(r.minY - p.y, 0, p.y - r.maxY);
  return Math.sqrt(dx * dx + dy * dy);
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
  return Math.min(
    distanceCoordinatesToSegment(r.minX, r.minY, start, end),
    distanceCoordinatesToSegment(r.maxX, r.minY, start, end),
    distanceCoordinatesToSegment(r.maxX, r.maxY, start, end),
    distanceCoordinatesToSegment(r.minX, r.maxY, start, end),
    distancePointToRect(r, start),
    distancePointToRect(r, end),
  );
}

/**
 * Shortest distance from a point to a polyline (open list of points).
 *
 * @param p - The point.
 * @param line - At least two points.
 * @returns Distance in mm.
 */
export function distancePointToPolyline(p: Point, line: readonly Point[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 1; i < line.length; i += 1) {
    best = Math.min(best, distancePointToSegment(p, line[i - 1]!, line[i]!));
  }
  return best;
}
