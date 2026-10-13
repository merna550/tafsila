/**
 * Rigid moves of points, segments and paths: translate, rotate, mirror, and rotating part of a path (dart closing).
 * All are affine, so moving a Bézier's control points moves the curve exactly. Angles in radians, maths sense.
 */
import { GEOMETRY_EPSILON_MM } from "../constants/geometry";
import { DraftingError } from "../errors/drafting-error";
import { cutPath } from "./path";
import { type Point, add, dot, normalize, pt, scale, sub } from "./point";
import { type PointMap, type ReadonlyPath, type Segment, mapSegment } from "./segment";

/** Anything the transforms accept: a point, a segment or a path. */
export type Shape = Point | Segment | ReadonlyPath;

/** The result type for a shape: a point stays a point, a segment a segment, a path a (new) path. */
export type Moved<S extends Shape> = S extends ReadonlyPath ? Segment[] : S extends Segment ? Segment : Point;

/** A range along a path, in mm from its start. */
export interface LengthRange {
  /** Start of the range, in mm. */
  readonly fromMm: number;
  /** End of the range, in mm. */
  readonly toMm: number;
}

/** A path cut in three around a range, with the middle part moved. */
export interface PivotResult {
  /** Segments before the range, unchanged. */
  readonly before: Segment[];
  /** Segments inside the range, rotated about the pivot. */
  readonly moved: Segment[];
  /** Segments after the range, unchanged. */
  readonly after: Segment[];
}

/**
 * Applies a point map to every point of a shape, returning a new shape of the same kind.
 *
 * @param shape - Point, segment or path.
 * @param map - The point map.
 * @returns The moved shape.
 */
export function applyToShape<S extends Shape>(shape: S, map: PointMap): Moved<S> {
  if (Array.isArray(shape)) return (shape as ReadonlyPath).map((seg) => mapSegment(seg, map)) as Moved<S>;
  if ("kind" in shape) return mapSegment(shape, map) as Moved<S>;
  return map(shape as Point) as Moved<S>;
}

/**
 * Moves a shape by a vector.
 *
 * @param shape - Point, segment or path.
 * @param offset - Displacement in mm.
 * @returns The moved shape.
 */
export function translate<S extends Shape>(shape: S, offset: Point): Moved<S> {
  return applyToShape(shape, (p) => add(p, offset));
}

/**
 * Rotates a shape about a centre point (positive angle turns +x towards +y).
 *
 * @param shape - Point, segment or path.
 * @param center - Centre of rotation.
 * @param angleRad - Rotation angle in radians.
 * @returns The rotated shape.
 * @example
 * rotateAbout(pt(10, 0), pt(0, 0), Math.PI / 2) // ≈ (0, 10)
 */
export function rotateAbout<S extends Shape>(shape: S, center: Point, angleRad: number): Moved<S> {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return applyToShape(shape, (p) => {
    const v = sub(p, center);
    return add(center, pt(v.x * cos - v.y * sin, v.x * sin + v.y * cos));
  });
}

/**
 * Mirrors a shape across the infinite line through a and b (for the other half of a symmetric piece).
 *
 * @param shape - Point, segment or path.
 * @param lineA - A point on the mirror line.
 * @param lineB - Another point on the mirror line.
 * @returns The mirrored shape.
 * @throws {DraftingError} GEOMETRY_DEGENERATE_SEGMENT when lineA and lineB coincide.
 */
export function mirrorAcross<S extends Shape>(shape: S, lineA: Point, lineB: Point): Moved<S> {
  const axis = normalize(sub(lineB, lineA));
  return applyToShape(shape, (p) => {
    const v = sub(p, lineA);
    const along = scale(axis, dot(v, axis));
    return add(lineA, sub(scale(along, 2), v));
  });
}

/**
 * Rotates the part of a path between two lengths about a pivot, leaving the rest in place.
 * Used to close a dart (pivot = dart apex) or to pivot a section of a block (slash-and-spread).
 *
 * @param path - The path.
 * @param range - The part to move, in mm along the path.
 * @param pivot - Centre of rotation.
 * @param angleRad - Rotation angle in radians.
 * @returns The three parts; `moved` no longer joins `before` and `after` unless the angle closes a dart exactly.
 * @throws {DraftingError} GEOMETRY_LENGTH_OUT_OF_RANGE when the range is empty or outside the path.
 */
export function rotateSegmentAround(
  path: ReadonlyPath,
  range: LengthRange,
  pivot: Point,
  angleRad: number,
): PivotResult {
  if (range.toMm - range.fromMm <= GEOMETRY_EPSILON_MM) {
    throw new DraftingError("GEOMETRY_LENGTH_OUT_OF_RANGE", `Empty range ${range.fromMm}–${range.toMm} mm`);
  }
  const [head, after] = cutPath(path, range.toMm);
  const [before, middle] = cutPath(head, range.fromMm);
  return { before, moved: rotateAbout(middle, pivot, angleRad), after };
}
