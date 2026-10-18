/**
 * Intersections: line–line (exact), line–cubic (cubic polynomial on the line normal), cubic–cubic (bounding-box
 * subdivision, Sederberg & Nishita style) and the self-intersection test for closed outlines (FR-VAL-05).
 */
import {
  INTERSECTION_TOLERANCE_MM,
  MAX_INTERSECTION_STEPS,
  MAX_SUBDIVISION_DEPTH,
  PARALLEL_SIN_EPSILON,
} from "../constants/geometry";
import { DraftingError } from "../errors/drafting-error";
import { pointOnCubic, splitCubic } from "./bezier";
import { isClosed } from "./path";
import { type Point, add, cross, distance, dot, norm, normalize, samePoint, scale, sub } from "./point";
import { bbox, bboxOverlap } from "./polygon";
import { solveCubic } from "./roots";
import { type CubicSegment, type ReadonlyPath, type Segment, assertPath, segmentPoints } from "./segment";

/** Slack on segment parameters so a crossing exactly at an end point is not lost to rounding. */
const PARAM_EPSILON = 1e-9;
/** Bernstein-to-power-basis factors for a cubic. */
const THREE = 3;
const SIX = 6;
/** Half of the parameter range. */
const HALF = 0.5;
/** Two cubics that do not share a stretch cross at most 3 × 3 = 9 times (Bézout's theorem). */
const MAX_CUBIC_CROSSINGS = 9;

/** Two straight-line ends; a line segment or an infinite line through both points. */
export interface LineLike {
  /** First point. */
  readonly from: Point;
  /** Second point. */
  readonly to: Point;
}

/** Where two shapes cross: the point and the parameter on each (0 = start, 1 = end). */
export interface Crossing {
  /** The crossing point. */
  readonly point: Point;
  /** Parameter on the first shape. */
  readonly t1: number;
  /** Parameter on the second shape. */
  readonly t2: number;
}

/**
 * True when t lies in [0, 1] give or take PARAM_EPSILON.
 *
 * @param t - Parameter.
 * @returns Whether it is on the segment.
 */
function inUnitRange(t: number): boolean {
  return t >= -PARAM_EPSILON && t <= 1 + PARAM_EPSILON;
}

/**
 * Crossing of two lines (exact).
 *
 * @param a - First line.
 * @param b - Second line.
 * @param infinite - When true, both are treated as infinite lines; otherwise as segments.
 * @returns The crossing, or null when parallel or (for segments) not touching.
 */
export function lineLine(a: LineLike, b: LineLike, infinite = false): Crossing | null {
  const r = sub(a.to, a.from);
  const s = sub(b.to, b.from);
  const denominator = cross(r, s);
  if (Math.abs(denominator) <= PARALLEL_SIN_EPSILON * norm(r) * norm(s)) return null;
  const qp = sub(b.from, a.from);
  const t1 = cross(qp, s) / denominator;
  const t2 = cross(qp, r) / denominator;
  if (!infinite && !(inUnitRange(t1) && inUnitRange(t2))) return null;
  return { point: add(a.from, scale(r, t1)), t1, t2 };
}

/**
 * Crossings of a line and a cubic: the cubic's signed distance to the line is a cubic polynomial in t.
 *
 * @param line - The line (segment unless `infinite`).
 * @param curve - The cubic.
 * @param infinite - When true, the line is infinite.
 * @returns Crossings sorted along the cubic; t1 is on the line, t2 on the cubic.
 * @throws {DraftingError} GEOMETRY_DEGENERATE_SEGMENT when the line has zero length.
 */
export function lineCubic(line: LineLike, curve: CubicSegment, infinite = false): Crossing[] {
  const dir = sub(line.to, line.from);
  const unit = normalize(dir);
  const [d0, d1, d2, d3] = segmentPoints(curve).map((p) => cross(unit, sub(p, line.from))) as [
    number,
    number,
    number,
    number,
  ];
  const roots = solveCubic(
    -d0 + THREE * d1 - THREE * d2 + d3,
    THREE * d0 - SIX * d1 + THREE * d2,
    -THREE * d0 + THREE * d1,
    d0,
  );
  return roots.filter(inUnitRange).flatMap((root) => {
    const t2 = Math.min(1, Math.max(0, root));
    const point = pointOnCubic(curve, t2);
    const t1 = dot(sub(point, line.from), dir) / dot(dir, dir);
    return infinite || inUnitRange(t1) ? [{ point, t1, t2 }] : [];
  });
}

/**
 * Distance from a point to the line through a cubic's end points (to its start when the ends coincide).
 *
 * @param curve - The cubic piece.
 * @param p - The point.
 * @returns Distance in mm.
 */
function distanceToChord(curve: CubicSegment, p: Point): number {
  const chord = sub(curve.to, curve.from);
  const length = norm(chord);
  return length === 0 ? distance(p, curve.from) : Math.abs(cross(chord, sub(p, curve.from))) / length;
}

/**
 * True when a cubic is straight within INTERSECTION_TOLERANCE_MM (both control points near the chord).
 *
 * @param curve - The cubic piece.
 * @returns Whether it can be treated as its chord.
 */
function isFlat(curve: CubicSegment): boolean {
  return (
    Math.max(distanceToChord(curve, curve.c1), distanceToChord(curve, curve.c2)) <= INTERSECTION_TOLERANCE_MM
  );
}

/** A cubic piece with the parameter range it covers on the original curve. */
interface Piece {
  /** The piece. */
  readonly curve: CubicSegment;
  /** Start parameter on the original. */
  readonly t0: number;
  /** End parameter on the original. */
  readonly t1: number;
}

/**
 * Halves a piece, keeping track of its parameter range.
 *
 * @param piece - The piece.
 * @returns Its two halves.
 */
function halve(piece: Piece): [Piece, Piece] {
  const [left, right] = splitCubic(piece.curve, HALF);
  const mid = (piece.t0 + piece.t1) / 2;
  return [
    { curve: left, t0: piece.t0, t1: mid },
    { curve: right, t0: mid, t1: piece.t1 },
  ];
}

/** Shared state of one curve–curve search. */
interface SearchState {
  /** Crossings found so far. */
  readonly found: Crossing[];
  /** Sub-problems visited (guards against overlapping curves). */
  steps: number;
}

/**
 * Recursive step of {@link cubicCubic}: discard pieces whose boxes miss, intersect chords once both are flat.
 *
 * @param a - Piece of the first curve.
 * @param b - Piece of the second curve.
 * @param depth - Recursion depth.
 * @param state - Search state (results and step count).
 * @throws {DraftingError} GEOMETRY_DEGENERATE_SEGMENT when the curves overlap along a stretch.
 */
function searchPieces(a: Piece, b: Piece, depth: number, state: SearchState): void {
  state.steps += 1;
  if (state.steps > MAX_INTERSECTION_STEPS) {
    throw new DraftingError("GEOMETRY_DEGENERATE_SEGMENT", "Curves overlap along a stretch");
  }
  if (!bboxOverlap(bbox(segmentPoints(a.curve)), bbox(segmentPoints(b.curve)))) return;
  if ((isFlat(a.curve) && isFlat(b.curve)) || depth >= MAX_SUBDIVISION_DEPTH) {
    const hit = lineLine(a.curve, b.curve);
    if (hit) {
      state.found.push({
        point: hit.point,
        t1: a.t0 + hit.t1 * (a.t1 - a.t0),
        t2: b.t0 + hit.t2 * (b.t1 - b.t0),
      });
    }
    return;
  }
  const [a1, a2] = halve(a);
  const [b1, b2] = halve(b);
  for (const pa of [a1, a2]) for (const pb of [b1, b2]) searchPieces(pa, pb, depth + 1, state);
}

/**
 * Drops crossings that repeat an earlier one within GEOMETRY_EPSILON_MM, sorted along the first shape.
 *
 * @param crossings - Raw crossings.
 * @returns Distinct crossings.
 */
function mergeCrossings(crossings: readonly Crossing[]): Crossing[] {
  const sorted = [...crossings].sort((x, y) => x.t1 - y.t1);
  return sorted.filter((c, i) => sorted.slice(0, i).every((d) => !samePoint(c.point, d.point)));
}

/**
 * Crossings of two cubics, to INTERSECTION_TOLERANCE_MM.
 *
 * @param first - First cubic.
 * @param second - Second cubic.
 * @returns Distinct crossings, sorted along the first cubic.
 * @throws {DraftingError} GEOMETRY_DEGENERATE_SEGMENT when the curves overlap along a stretch.
 */
export function cubicCubic(first: CubicSegment, second: CubicSegment): Crossing[] {
  const state: SearchState = { found: [], steps: 0 };
  searchPieces({ curve: first, t0: 0, t1: 1 }, { curve: second, t0: 0, t1: 1 }, 0, state);
  const crossings = mergeCrossings(state.found);
  if (crossings.length > MAX_CUBIC_CROSSINGS) {
    throw new DraftingError("GEOMETRY_DEGENERATE_SEGMENT", "Curves overlap along a stretch");
  }
  return crossings;
}

/**
 * Crossings of any two segments (line or cubic).
 *
 * @param first - First segment.
 * @param second - Second segment.
 * @returns Distinct crossings; t1 on the first, t2 on the second.
 */
export function intersectSegments(first: Segment, second: Segment): Crossing[] {
  if (first.kind === "line" && second.kind === "line") {
    const hit = lineLine(first, second);
    return hit ? [hit] : [];
  }
  if (first.kind === "line") return mergeCrossings(lineCubic(first, second as CubicSegment));
  if (second.kind === "line") {
    return mergeCrossings(lineCubic(second, first).map((c) => ({ point: c.point, t1: c.t2, t2: c.t1 })));
  }
  return cubicCubic(first, second);
}

/**
 * The joint two segments of a closed path share, if they are neighbours.
 *
 * @param path - The closed path.
 * @param i - Lower segment index.
 * @param j - Higher segment index.
 * @returns The shared joints (none, one, or two for a two-segment path).
 */
function sharedJoints(path: ReadonlyPath, i: number, j: number): Point[] {
  const joints: Point[] = [];
  if (j === i + 1) joints.push(path[i]!.to);
  if (i === 0 && j === path.length - 1) joints.push(path[0]!.from);
  return joints;
}

/**
 * Points where a closed outline crosses itself (FR-VAL-05). Neighbouring segments meeting only at their joint
 * do not count. A single cubic looping over itself is not detected.
 *
 * @param path - The closed path.
 * @returns Distinct crossing points (empty for a simple outline).
 * @throws {DraftingError} GEOMETRY_PATH_NOT_CLOSED when the path is open.
 */
export function selfIntersections(path: ReadonlyPath): Point[] {
  assertPath(path);
  if (!isClosed(path)) throw new DraftingError("GEOMETRY_PATH_NOT_CLOSED", "Outline is not closed");
  const found: Crossing[] = [];
  const boxes = path.map((segment) => bbox(segmentPoints(segment)));
  path.forEach((first, i) => {
    path.slice(i + 1).forEach((second, offset) => {
      // A curve stays inside the box of its control points, so segments with apart boxes cannot cross.
      if (!bboxOverlap(boxes[i]!, boxes[i + 1 + offset]!)) return;
      const joints = sharedJoints(path, i, i + 1 + offset);
      const crossings = intersectSegments(first, second);
      found.push(...crossings.filter((c) => !joints.some((joint) => samePoint(joint, c.point))));
    });
  });
  return found.map((c) => c.point).filter((p, i, all) => all.slice(0, i).every((q) => !samePoint(p, q)));
}
