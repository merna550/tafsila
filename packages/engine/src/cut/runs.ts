/**
 * Splits a cut line into runs between corners and places the offset points along curves (issue #284, FR-CUT-02,
 * decision 284 items 1-2). Corners are found on the cut path itself, by tangent breaks, because cut segments do not
 * map one to one to the piece edges (mitres and hem corners add segments).
 */
import type { Point, Segment } from "@tafsila/schemas";
import { CUT_CORNER_ANGLE_DEG, CUT_LINE_KINK_ANGLE_DEG, CUT_STRAIGHT_TOLERANCE_MM } from "../constants/cut";
import { GEOMETRY_EPSILON_MM } from "../constants/geometry";
import {
  type ReadonlyPath,
  distancePointToSegment,
  dot,
  reversePath,
  segmentLength,
  tangentOnSegment,
} from "../geometry";

/** Degrees in half a turn, to turn the corner threshold into radians. */
const HALF_TURN_DEG = 180;

/** One stretch of the cut line between two corners. */
export interface CutRun {
  /** A ruler line (`straight`) or anything else (`curve`). */
  readonly kind: "straight" | "curve";
  /** Its segments, in walking order; the first starts at a corner and the last ends at the next. */
  readonly segments: readonly Segment[];
}

/**
 * Whether the cut line turns by more than the corner threshold where one segment meets the next. Between two lines any
 * visible kink is a corner (a ruler cannot bend), so the line threshold is much smaller.
 *
 * @param before - The segment that ends at the join.
 * @param after - The segment that starts at the join.
 * @returns Whether the join is a corner.
 */
function isCorner(before: Segment, after: Segment): boolean {
  const cosine = dot(tangentOnSegment(before, 1), tangentOnSegment(after, 0));
  const bothLines = before.kind === "line" && after.kind === "line";
  const limitDeg = bothLines ? CUT_LINE_KINK_ANGLE_DEG : CUT_CORNER_ANGLE_DEG;
  return cosine < Math.cos((limitDeg * Math.PI) / HALF_TURN_DEG);
}

/**
 * Whether a list of segments is one straight line: all lines, every end within the straight tolerance of the chord.
 *
 * @param segments - The segments of a run.
 * @returns Whether a ruler can draw it in one go.
 */
function isStraight(segments: readonly Segment[]): boolean {
  if (segments.some((seg) => seg.kind !== "line")) return false;
  const start = segments[0]!.from;
  const end = segments.at(-1)!.to;
  return segments.every((seg) => distancePointToSegment(seg.to, start, end) <= CUT_STRAIGHT_TOLERANCE_MM);
}

/**
 * Builds a run from its segments.
 *
 * @param segments - The segments, in order.
 * @returns The run with its kind.
 */
function toRun(segments: readonly Segment[]): CutRun {
  return { kind: isStraight(segments) ? "straight" : "curve", segments };
}

/**
 * Splits a closed cut line into runs between corners (a turn sharper than CUT_CORNER_ANGLE_DEG). Segments shorter than
 * the geometry epsilon have no direction and are left out. A line with no corner at all is one curve run from its
 * first point.
 *
 * @param cutPath - The closed cut line.
 * @returns The runs, in path order; the first starts at the path's first corner.
 * @example
 * cutRuns(rectangle).length // 4
 */
export function cutRuns(cutPath: ReadonlyPath): CutRun[] {
  const segments = cutPath.filter((seg) => segmentLength(seg) > GEOMETRY_EPSILON_MM);
  const count = segments.length;
  const corners = segments
    .map((seg, i) => (isCorner(segments[(i - 1 + count) % count]!, seg) ? i : -1))
    .filter((i) => i >= 0);
  if (corners.length === 0) return [toRun(segments)];
  return corners.map((start, k) => {
    const end = corners[(k + 1) % corners.length]!;
    const run =
      end > start ? segments.slice(start, end) : [...segments.slice(start), ...segments.slice(0, end)];
    return toRun(run);
  });
}

/**
 * The same run walked the other way.
 *
 * @param run - The run.
 * @returns The run from its end corner to its start corner.
 */
export function reverseRun(run: CutRun): CutRun {
  return { kind: run.kind, segments: reversePath(run.segments) };
}

/**
 * The corner a run starts at.
 *
 * @param run - The run.
 * @returns Its first point.
 */
export function runStart(run: CutRun): Point {
  return run.segments[0]!.from;
}
