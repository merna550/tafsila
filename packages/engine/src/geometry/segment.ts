/** Path segments (`line` | `cubic`, from `@tafsila/schemas`): builders and point-wise helpers. Lengths in mm. */
import type { Segment } from "@tafsila/schemas";
import { GEOMETRY_EPSILON_MM } from "../constants/geometry";
import { DraftingError } from "../errors/drafting-error";
import { type Point, assertFinitePoint, distance } from "./point";

export type { Path, Segment } from "@tafsila/schemas";

/** A straight segment. */
export type LineSegment = Extract<Segment, { kind: "line" }>;

/** A cubic Bézier segment: start, two control points, end. */
export type CubicSegment = Extract<Segment, { kind: "cubic" }>;

/** A path the geometry kit reads but never changes. */
export type ReadonlyPath = readonly Segment[];

/** A function that moves one point; used to move every point of a segment or path the same way. */
export type PointMap = (p: Point) => Point;

/**
 * Builds a straight segment.
 *
 * @param from - Start point.
 * @param to - End point.
 * @returns The line segment.
 */
export function lineSeg(from: Point, to: Point): LineSegment {
  return { kind: "line", from, to };
}

/**
 * Builds a cubic Bézier segment.
 *
 * @param from - Start point.
 * @param c1 - First control point (sets the start direction).
 * @param c2 - Second control point (sets the end direction).
 * @param to - End point.
 * @returns The cubic segment.
 */
export function cubicSeg(from: Point, c1: Point, c2: Point, to: Point): CubicSegment {
  return { kind: "cubic", from, c1, c2, to };
}

/**
 * All defining points of a segment, in order (2 for a line, 4 for a cubic).
 *
 * @param seg - The segment.
 * @returns Its points.
 */
export function segmentPoints(seg: Segment): Point[] {
  return seg.kind === "line" ? [seg.from, seg.to] : [seg.from, seg.c1, seg.c2, seg.to];
}

/**
 * Applies a point map to every defining point of a segment (exact for affine maps such as rotation and mirroring).
 *
 * @param seg - The segment.
 * @param map - The point map.
 * @returns A new segment of the same kind.
 */
export function mapSegment(seg: Segment, map: PointMap): Segment {
  if (seg.kind === "line") return lineSeg(map(seg.from), map(seg.to));
  return cubicSeg(map(seg.from), map(seg.c1), map(seg.c2), map(seg.to));
}

/**
 * The same segment run the other way.
 *
 * @param seg - The segment.
 * @returns The reversed segment.
 */
export function reverseSegment(seg: Segment): Segment {
  if (seg.kind === "line") return lineSeg(seg.to, seg.from);
  return cubicSeg(seg.to, seg.c2, seg.c1, seg.from);
}

/**
 * Rejects segments the maths cannot use: a non-finite coordinate, or all points in one place.
 *
 * @param seg - The segment to check.
 * @throws {DraftingError} GEOMETRY_DEGENERATE_SEGMENT for a non-finite or zero-length segment.
 */
export function assertSegment(seg: Segment): void {
  const points = segmentPoints(seg);
  points.forEach(assertFinitePoint);
  if (points.every((p) => distance(p, seg.from) < GEOMETRY_EPSILON_MM)) {
    throw new DraftingError("GEOMETRY_DEGENERATE_SEGMENT", "Segment has zero length");
  }
}

/**
 * Rejects an empty path or one with a degenerate segment.
 *
 * @param path - The path to check.
 * @throws {DraftingError} GEOMETRY_DEGENERATE_SEGMENT when the path is empty or a segment is degenerate.
 */
export function assertPath(path: ReadonlyPath): void {
  if (path.length === 0) throw new DraftingError("GEOMETRY_DEGENERATE_SEGMENT", "Path has no segments");
  path.forEach(assertSegment);
}
