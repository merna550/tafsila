/**
 * Parallel offset of a path, used for seam allowance (FR-PAT-03). Lines are offset exactly; cubics by the
 * Tiller–Hanson control-polygon method, split until within OFFSET_TOLERANCE_MM (Tiller & Hanson 1984).
 * Corners meet at the mitre point, cut square past MITRE_LIMIT × distance. Seam-specific corners
 * (fold-back at darts and hems) are not handled here (issue #130).
 */
import {
  GEOMETRY_EPSILON_MM,
  MITRE_LIMIT,
  OFFSET_MAX_DEPTH,
  OFFSET_TOLERANCE_MM,
} from "../constants/geometry";
import { DraftingError } from "../errors/drafting-error";
import { pointOnCubic, splitCubic, tangentOnCubic } from "./bezier";
import { intersectSegments, lineLine } from "./intersect";
import { isClosed, splitSegmentAt, tangentOnSegment } from "./path";
import { type Point, add, distance, norm, normalize, pt, samePoint, scale, sub } from "./point";
import {
  type CubicSegment,
  type ReadonlyPath,
  type Segment,
  assertPath,
  cubicSeg,
  lineSeg,
  mapSegment,
} from "./segment";

/** Checks along each offset cubic, excluding its exact ends. */
const ERROR_SAMPLES = 8;
/** Half of the parameter range. */
const HALF = 0.5;

/** How corners between offset segments are closed. */
export interface OffsetOptions {
  /** Corner style; only the mitre (with a square cut past the limit) exists today. */
  readonly corner?: "mitre";
}

/**
 * Outward normal for a closed path that runs anticlockwise in maths axes (positive signed area): (y, −x).
 *
 * @param direction - Unit direction of travel.
 * @returns Unit normal to the right of travel.
 */
function outwardNormal(direction: Point): Point {
  return pt(direction.y, -direction.x);
}

/**
 * First vector in the list with a usable direction (skips control points sitting on an end point).
 *
 * @param candidates - Vectors in order of preference.
 * @returns Unit direction.
 */
function firstDirection(candidates: readonly Point[]): Point {
  const found = candidates.find((v) => norm(v) > GEOMETRY_EPSILON_MM) ?? candidates.at(-1)!;
  return normalize(found);
}

/**
 * A leg of the control polygon moved sideways, as a line through two points.
 *
 * @param base - A point on the original leg.
 * @param direction - Unit direction of the leg.
 * @param shift - Sideways offset vector.
 * @returns The moved line.
 */
function offsetLeg(base: Point, direction: Point, shift: Point): { from: Point; to: Point } {
  const from = add(base, shift);
  return { from, to: add(from, direction) };
}

/**
 * One Tiller–Hanson step: offset the three legs of the control polygon and meet them again.
 *
 * @param curve - The cubic.
 * @param distanceMm - Offset distance (positive = outward).
 * @returns The approximate offset cubic.
 */
function tillerHanson(curve: CubicSegment, distanceMm: number): CubicSegment {
  const { from, c1, c2, to } = curve;
  const chord = sub(to, from);
  const dirs = [
    firstDirection([sub(c1, from), sub(c2, from), chord]),
    firstDirection([sub(c2, c1), chord]),
    firstDirection([sub(to, c2), sub(to, c1), chord]),
  ] as const;
  const shift = dirs.map((d) => scale(outwardNormal(d), distanceMm));
  const newC1 = lineLine(offsetLeg(from, dirs[0], shift[0]!), offsetLeg(c1, dirs[1], shift[1]!), true);
  const newC2 = lineLine(offsetLeg(c2, dirs[1], shift[1]!), offsetLeg(c2, dirs[2], shift[2]!), true);
  return cubicSeg(
    add(from, shift[0]!),
    newC1?.point ?? add(c1, shift[0]!),
    newC2?.point ?? add(c2, shift[2]!),
    add(to, shift[2]!),
  );
}

/**
 * Largest gap between an approximate offset cubic and the true offset at evenly spaced parameters.
 *
 * @param curve - The original cubic.
 * @param candidate - Its approximate offset.
 * @param distanceMm - Offset distance.
 * @returns Error in mm (an upper estimate).
 */
function offsetError(curve: CubicSegment, candidate: CubicSegment, distanceMm: number): number {
  let worst = 0;
  for (let i = 1; i < ERROR_SAMPLES; i += 1) {
    const t = i / ERROR_SAMPLES;
    const exact = add(pointOnCubic(curve, t), scale(outwardNormal(tangentOnCubic(curve, t)), distanceMm));
    worst = Math.max(worst, distance(exact, pointOnCubic(candidate, t)));
  }
  return worst;
}

/**
 * Offsets a cubic, splitting it until each piece is within OFFSET_TOLERANCE_MM.
 *
 * @param curve - The cubic.
 * @param distanceMm - Offset distance.
 * @param depth - Recursion depth.
 * @returns Offset cubics in order.
 * @throws {DraftingError} GEOMETRY_OFFSET_FAILED when the curve bends tighter than the offset (a cusp).
 */
function offsetCubic(curve: CubicSegment, distanceMm: number, depth: number): CubicSegment[] {
  const candidate = tillerHanson(curve, distanceMm);
  if (offsetError(curve, candidate, distanceMm) <= OFFSET_TOLERANCE_MM) return [candidate];
  if (depth >= OFFSET_MAX_DEPTH) {
    throw new DraftingError(
      "GEOMETRY_OFFSET_FAILED",
      `Curve bends too tightly for a ${distanceMm} mm offset`,
    );
  }
  const [left, right] = splitCubic(curve, HALF);
  return [...offsetCubic(left, distanceMm, depth + 1), ...offsetCubic(right, distanceMm, depth + 1)];
}

/**
 * Offsets one segment (exact for a line).
 *
 * @param seg - The segment.
 * @param distanceMm - Offset distance.
 * @returns Offset segments in order.
 */
function offsetSegment(seg: Segment, distanceMm: number): Segment[] {
  if (distanceMm === 0) return [seg];
  if (seg.kind === "cubic") return offsetCubic(seg, distanceMm, 0);
  const shift = scale(outwardNormal(normalize(sub(seg.to, seg.from))), distanceMm);
  return [mapSegment(seg, (p) => add(p, shift))];
}

/**
 * Straight segments through the given points, skipping zero-length steps.
 *
 * @param points - Points in order.
 * @returns Line segments.
 */
function polyline(points: readonly Point[]): Segment[] {
  return points.slice(1).flatMap((p, i) => (samePoint(points[i]!, p) ? [] : [lineSeg(points[i]!, p)]));
}

/** The original corner and the offset distance there. */
interface CornerLimit {
  /** The corner point of the original path. */
  readonly corner: Point;
  /** Absolute offset distance at the corner, in mm. */
  readonly distanceMm: number;
}

/** Builds the segments that close an outside corner between two offset pieces. */
type CornerBridge = (
  endPoint: Point,
  startPoint: Point,
  tangents: readonly [Point, Point],
  limit: CornerLimit,
) => Segment[];

/** Two offset pieces after their shared corner has been closed. */
interface Joined {
  /** The piece before the corner, possibly trimmed. */
  readonly end: Segment[];
  /** Segments added to close the corner (empty when trimmed). */
  readonly bridge: Segment[];
  /** The piece after the corner, possibly trimmed. */
  readonly start: Segment[];
}

/**
 * Trims two overlapping offset pieces at their crossing (an inside corner).
 *
 * @param end - Piece before the corner.
 * @param start - Piece after the corner.
 * @returns The trimmed pieces, or null when they do not cross.
 */
function trimAtCrossing(end: readonly Segment[], start: readonly Segment[]): Joined | null {
  const last = end.at(-1)!;
  const first = start[0]!;
  const crossings = intersectSegments(last, first);
  if (crossings.length === 0) return null;
  const best = crossings.reduce((a, b) => (b.t1 - b.t2 > a.t1 - a.t2 ? b : a), crossings[0]!);
  return {
    end: [...end.slice(0, -1), splitSegmentAt(last, best.t1)[0]],
    bridge: [],
    start: [splitSegmentAt(first, best.t2)[1], ...start.slice(1)],
  };
}

/**
 * Bridge across an outside corner: the mitre point, or a square cut when the mitre would pass the limit.
 *
 * @param endPoint - Where the piece before the corner ends.
 * @param startPoint - Where the piece after the corner starts.
 * @param tangents - Unit directions of travel at endPoint and startPoint.
 * @param limit - The original corner and the offset distance there; the mitre may reach MITRE_LIMIT × distance.
 * @returns Bridge segments.
 */
function mitreBridge(
  endPoint: Point,
  startPoint: Point,
  tangents: readonly [Point, Point],
  limit: CornerLimit,
): Segment[] {
  const [te, ts] = tangents;
  const tip = lineLine(
    { from: endPoint, to: add(endPoint, te) },
    { from: startPoint, to: add(startPoint, ts) },
    true,
  );
  if (!tip || tip.t1 <= 0 || tip.t2 >= 0) return polyline([endPoint, startPoint]);
  const reachMm = distance(limit.corner, tip.point);
  const limitMm = MITRE_LIMIT * limit.distanceMm;
  if (reachMm <= limitMm) return polyline([endPoint, tip.point, startPoint]);
  const fraction = Math.min(1, Math.max(0, (limitMm - limit.distanceMm) / (reachMm - limit.distanceMm)));
  const cutEnd = add(endPoint, scale(te, tip.t1 * fraction));
  const cutStart = add(startPoint, scale(ts, tip.t2 * fraction));
  return polyline([endPoint, cutEnd, cutStart, startPoint]);
}

/** Corner styles by name (#130 adds seam-specific ones). */
const CORNER_BRIDGES: Record<NonNullable<OffsetOptions["corner"]>, CornerBridge> = { mitre: mitreBridge };

/**
 * Closes the corner between two consecutive offset pieces.
 *
 * @param end - Offset piece before the corner.
 * @param start - Offset piece after the corner.
 * @param limit - The original corner point and the larger of the two offset distances (absolute).
 * @param bridgeCorner - How an outside corner is closed.
 * @returns The joined pieces.
 */
function joinCorner(
  end: readonly Segment[],
  start: readonly Segment[],
  limit: CornerLimit,
  bridgeCorner: CornerBridge,
): Joined {
  const last = end.at(-1)!;
  const first = start[0]!;
  if (samePoint(last.to, first.from)) return { end: [...end], bridge: [], start: [...start] };
  const trimmed = trimAtCrossing(end, start);
  if (trimmed) return trimmed;
  const tangents = [tangentOnSegment(last, 1), tangentOnSegment(first, 0)] as const;
  const bridge = bridgeCorner(last.to, first.from, tangents, limit);
  return { end: [...end], bridge, start: [...start] };
}

/**
 * Checks and expands the per-segment distances.
 *
 * @param path - The path.
 * @param distanceMm - One distance for all segments, or one per segment.
 * @returns One finite distance per segment.
 * @throws {DraftingError} GEOMETRY_OFFSET_FAILED when the list length does not match or a value is not finite.
 */
function distancesFor(path: ReadonlyPath, distanceMm: number | readonly number[]): number[] {
  const list = typeof distanceMm === "number" ? path.map(() => distanceMm) : [...distanceMm];
  if (list.length !== path.length || !list.every(Number.isFinite)) {
    throw new DraftingError("GEOMETRY_OFFSET_FAILED", "Need one finite offset distance per segment");
  }
  return list;
}

/**
 * Offsets a path by a distance per segment (its seam allowance). Positive distances move a closed path that runs
 * anticlockwise in maths axes (positive `signedArea`) outwards; negative distances move it inwards.
 *
 * @param path - The stitch path.
 * @param distanceMm - Offset in mm, one for all segments or one per segment.
 * @param options - Corner style (mitre by default).
 * @returns The offset path (closed when the input is closed).
 * @throws {DraftingError} GEOMETRY_OFFSET_FAILED for bad distances or a curve tighter than its offset.
 * @example
 * offsetPath(square100, 10) // a 120 mm square, perimeter 480 mm
 */
export function offsetPath(
  path: ReadonlyPath,
  distanceMm: number | readonly number[],
  options: OffsetOptions = { corner: "mitre" },
): Segment[] {
  assertPath(path);
  const bridgeCorner = CORNER_BRIDGES[options.corner ?? "mitre"];
  const distances = distancesFor(path, distanceMm);
  const pieces = path.map((seg, i) => offsetSegment(seg, distances[i]!));
  const bridges: Segment[][] = path.map(() => []);
  const pairs = path.map((_, i) => [i, (i + 1) % path.length] as const);
  const corners = isClosed(path) ? pairs : pairs.slice(0, -1);
  for (const [i, j] of corners) {
    const limit = Math.max(Math.abs(distances[i]!), Math.abs(distances[j]!));
    const joined = joinCorner(
      pieces[i]!,
      pieces[j]!,
      { corner: path[i]!.to, distanceMm: limit },
      bridgeCorner,
    );
    pieces[i] = joined.end;
    bridges[i] = joined.bridge;
    pieces[j] = joined.start;
  }
  return pieces.flatMap((piece, i) => [...piece, ...bridges[i]!]);
}
