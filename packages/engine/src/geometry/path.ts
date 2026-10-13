/** Paths (ordered, continuous segments): length, positions by length, splitting, reversing, sampling. Lengths in mm. */
import { GEOMETRY_EPSILON_MM, POLYGON_SAMPLES_PER_CURVE } from "../constants/geometry";
import { DraftingError } from "../errors/drafting-error";
import { cubicLength, pointOnCubic, sampleCubic, splitCubic, tAtLength, tangentOnCubic } from "./bezier";
import { type Point, distance, lerp, normalize, samePoint, sub } from "./point";
import { type ReadonlyPath, type Segment, assertPath, lineSeg, reverseSegment } from "./segment";

/** Where a length along a path falls: which segment, and the parameter t inside it. */
export interface PathLocation {
  /** Index of the segment in the path. */
  readonly index: number;
  /** Parameter inside that segment, 0 (its start) to 1 (its end). */
  readonly t: number;
}

/**
 * Length of one segment (exact for lines, adaptive for cubics).
 *
 * @param seg - The segment.
 * @returns Length in mm.
 */
export function segmentLength(seg: Segment): number {
  return seg.kind === "line" ? distance(seg.from, seg.to) : cubicLength(seg);
}

/**
 * Total length of a path; this is the seam length used by validation (FR-VAL-01).
 *
 * @param path - The path.
 * @returns Length in mm.
 */
export function pathLength(path: ReadonlyPath): number {
  return path.reduce((sum, seg) => sum + segmentLength(seg), 0);
}

/**
 * Point on a segment at parameter t.
 *
 * @param seg - The segment.
 * @param t - Parameter in [0, 1].
 * @returns The point.
 */
export function pointOnSegment(seg: Segment, t: number): Point {
  return seg.kind === "line" ? lerp(seg.from, seg.to, t) : pointOnCubic(seg, t);
}

/**
 * Unit direction of travel on a segment at parameter t.
 *
 * @param seg - The segment.
 * @param t - Parameter in [0, 1].
 * @returns The unit tangent.
 */
export function tangentOnSegment(seg: Segment, t: number): Point {
  return seg.kind === "line" ? normalize(sub(seg.to, seg.from)) : tangentOnCubic(seg, t);
}

/**
 * Splits a segment at parameter t into the part before and the part after.
 *
 * @param seg - The segment.
 * @param t - Split parameter in [0, 1].
 * @returns Both parts.
 */
export function splitSegmentAt(seg: Segment, t: number): [Segment, Segment] {
  if (seg.kind === "cubic") return splitCubic(seg, t);
  const mid = lerp(seg.from, seg.to, t);
  return [lineSeg(seg.from, mid), lineSeg(mid, seg.to)];
}

/**
 * Parameter t at which a segment has covered a length from its start.
 *
 * @param seg - The segment.
 * @param lengthMm - Distance from the segment start, in mm (0 to its length).
 * @returns t in [0, 1].
 */
function segmentTAtLength(seg: Segment, lengthMm: number): number {
  if (seg.kind === "cubic") return tAtLength(seg, lengthMm);
  return Math.min(1, Math.max(0, lengthMm / distance(seg.from, seg.to)));
}

/**
 * Finds the segment and parameter at a length along the path.
 *
 * @param path - The path.
 * @param lengthMm - Distance from the path start, in mm.
 * @returns The location.
 * @throws {DraftingError} GEOMETRY_LENGTH_OUT_OF_RANGE when lengthMm is negative or past the end.
 */
export function locateAtLength(path: ReadonlyPath, lengthMm: number): PathLocation {
  assertPath(path);
  const total = pathLength(path);
  if (!(lengthMm >= -GEOMETRY_EPSILON_MM && lengthMm <= total + GEOMETRY_EPSILON_MM)) {
    throw new DraftingError("GEOMETRY_LENGTH_OUT_OF_RANGE", `${lengthMm} mm is outside a ${total} mm path`);
  }
  let remaining = Math.max(0, lengthMm);
  for (let index = 0; index < path.length; index += 1) {
    const seg = path[index]!;
    const length = segmentLength(seg);
    if (remaining <= length || index === path.length - 1) {
      return { index, t: segmentTAtLength(seg, Math.min(remaining, length)) };
    }
    remaining -= length;
  }
  return { index: path.length - 1, t: 1 };
}

/**
 * Point at a distance along the path (for notches, dart legs and marks).
 *
 * @param path - The path.
 * @param lengthMm - Distance from the path start, in mm.
 * @returns The point.
 */
export function pointAtLength(path: ReadonlyPath, lengthMm: number): Point {
  const { index, t } = locateAtLength(path, lengthMm);
  return pointOnSegment(path[index]!, t);
}

/**
 * Unit direction of travel at a distance along the path.
 *
 * @param path - The path.
 * @param lengthMm - Distance from the path start, in mm.
 * @returns The unit tangent.
 */
export function tangentAtLength(path: ReadonlyPath, lengthMm: number): Point {
  const { index, t } = locateAtLength(path, lengthMm);
  return tangentOnSegment(path[index]!, t);
}

/**
 * Cuts a path at a length; either side may be empty when the cut falls on an end (or on a segment joint).
 *
 * @param path - The path.
 * @param lengthMm - Where to cut, in mm from the start.
 * @returns Segments before and after the cut.
 */
export function cutPath(path: ReadonlyPath, lengthMm: number): [Segment[], Segment[]] {
  const { index, t } = locateAtLength(path, lengthMm);
  const seg = path[index]!;
  const before = path.slice(0, index);
  const after = path.slice(index + 1);
  const point = pointOnSegment(seg, t);
  if (samePoint(point, seg.from)) return [before, [seg, ...after]];
  if (samePoint(point, seg.to)) return [[...before, seg], after];
  const [head, tail] = splitSegmentAt(seg, t);
  return [
    [...before, head],
    [tail, ...after],
  ];
}

/**
 * Splits a path in two at a length strictly inside it.
 *
 * @param path - The path.
 * @param lengthMm - Where to split, in mm from the start.
 * @returns The path before and the path after the split; their lengths add up to the whole.
 * @throws {DraftingError} GEOMETRY_LENGTH_OUT_OF_RANGE when the split is not strictly inside the path.
 */
export function splitAtLength(path: ReadonlyPath, lengthMm: number): [Segment[], Segment[]] {
  const [before, after] = cutPath(path, lengthMm);
  if (before.length === 0 || after.length === 0) {
    throw new DraftingError("GEOMETRY_LENGTH_OUT_OF_RANGE", `Split at ${lengthMm} mm is not inside the path`);
  }
  return [before, after];
}

/**
 * The part of a path between two lengths (for an edge, a facing or a dart section).
 *
 * @param path - The path.
 * @param fromMm - Start of the part, in mm from the path start.
 * @param toMm - End of the part, in mm from the path start (greater than fromMm).
 * @returns The sub-path.
 * @throws {DraftingError} GEOMETRY_LENGTH_OUT_OF_RANGE when the range is empty or outside the path.
 */
export function subPath(path: ReadonlyPath, fromMm: number, toMm: number): Segment[] {
  if (toMm - fromMm <= GEOMETRY_EPSILON_MM) {
    throw new DraftingError("GEOMETRY_LENGTH_OUT_OF_RANGE", `Empty range ${fromMm}–${toMm} mm`);
  }
  const [head] = cutPath(path, toMm);
  return cutPath(head, fromMm)[1];
}

/**
 * The same path run from end to start.
 *
 * @param path - The path.
 * @returns A new reversed path.
 */
export function reversePath(path: ReadonlyPath): Segment[] {
  return [...path].reverse().map(reverseSegment);
}

/**
 * True when the path ends where it starts (within GEOMETRY_EPSILON_MM), like a stitch or cut line.
 *
 * @param path - The path.
 * @returns Whether the path is closed.
 */
export function isClosed(path: ReadonlyPath): boolean {
  const first = path[0];
  const last = path.at(-1);
  return first !== undefined && last !== undefined && samePoint(first.from, last.to);
}

/**
 * Turns a path into points (a polyline); cubics become several straight pieces.
 *
 * @param path - The path.
 * @param samplesPerCurve - Straight pieces per cubic; defaults to POLYGON_SAMPLES_PER_CURVE.
 * @returns Points from the start to the end of the path (a closed path repeats its first point last).
 */
export function samplePath(path: ReadonlyPath, samplesPerCurve: number = POLYGON_SAMPLES_PER_CURVE): Point[] {
  const first = path[0];
  if (!first) return [];
  const points: Point[] = [first.from];
  for (const seg of path) {
    if (seg.kind === "line") points.push(seg.to);
    else points.push(...sampleCubic(seg, samplesPerCurve).slice(1));
  }
  return points;
}
