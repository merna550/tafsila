/**
 * Offset points along a curved stretch of the cut line (issue #284, FR-CUT-02, decision 284 items 2 and 8): equal gaps
 * no longer than the step, plus a point on a tight bend where a smooth curve through the points would miss the cut line.
 */
import type { Point } from "@tafsila/schemas";
import {
  CUT_CONNECTION_SAMPLES_PER_GAP,
  CUT_CURVE_MAX_REFINEMENTS,
  CUT_CURVE_TOLERANCE_MM,
  CUT_FRAME_SAMPLES_PER_CURVE,
} from "../constants/cut";
import { GEOMETRY_EPSILON_MM } from "../constants/geometry";
import {
  type CubicSegment,
  type ReadonlyPath,
  curveThroughPoints,
  distancePointToPolyline,
  pathLength,
  pointAtLength,
  samplePath,
  add,
  distance,
  scale,
  sub,
} from "../geometry";

import type { CutRun } from "./runs";

/** Half, for the parabola end direction. */
const HALF = 0.5;

/** Weight of the second point in the parabola end direction `(4 (b - a) + (a - c)) / 2`. */
const PARABOLA_NEXT_WEIGHT = 4;

/**
 * Direction at the first of three or more points, from the parabola through the first three (`(-3a + 4b - c) / 2`);
 * with two points, the chord. A French curve laid on the first points follows the same bend.
 *
 * @param first - First point.
 * @param second - Second point.
 * @param third - Third point, when there is one.
 * @returns The direction of travel at `first` (any length).
 */
function endDirection(first: Point, second: Point, third: Point | undefined): Point {
  if (!third) return sub(second, first);
  return scale(add(scale(sub(second, first), PARABOLA_NEXT_WEIGHT), sub(first, third)), HALF);
}

/**
 * The smooth curve a tailor draws through marked points with a French curve: a Catmull-Rom spline whose ends follow
 * the bend of the first and last three points. The diagram (#292) draws it, and the property test checks it against
 * the cut line.
 *
 * @param points - At least two distinct points, in order.
 * @returns One cubic per gap.
 * @example
 * connectionCurve([a, b, c]).length // 2
 */
export function connectionCurve(points: readonly Point[]): CubicSegment[] {
  const reversed = [...points].reverse();
  const start = endDirection(points[0]!, points[1]!, points[2]);
  const end = scale(endDirection(reversed[0]!, reversed[1]!, reversed[2]), -1);
  return curveThroughPoints(points, start, end);
}

/** A curve run sampled once: its points and the distance along it of each, mm. */
interface SampledRun {
  /** Points along the run. */
  readonly points: readonly Point[];
  /** Distance along the run of each point, mm (chord sums, close to the arc length). */
  readonly at: readonly number[];
}

/**
 * Samples a run once, with the distance along it of every sample.
 *
 * @param segments - The run.
 * @returns The samples.
 */
function sampleRun(segments: ReadonlyPath): SampledRun {
  const points = samplePath(segments, CUT_FRAME_SAMPLES_PER_CURVE);
  const at = [0];
  for (let i = 1; i < points.length; i += 1) at.push(at[i - 1]! + distance(points[i - 1]!, points[i]!));
  return { points, at };
}

/**
 * The samples of a run between two distances along it.
 *
 * @param run - The sampled run.
 * @param fromMm - Start distance, mm.
 * @param toMm - End distance, mm.
 * @returns The samples in that range (at least two).
 */
function samplesBetween(run: SampledRun, fromMm: number, toMm: number): Point[] {
  const first = Math.max(0, run.at.findIndex((s) => s >= fromMm) - 1);
  const after = run.at.findIndex((s) => s > toMm);
  return run.points.slice(first, after < 0 ? run.points.length : after + 1);
}

/**
 * The gap where the smooth curve through the points strays furthest from the cut line, measured against the part of
 * the cut line from one step before the gap to one step after it.
 *
 * @param segments - The curve run.
 * @param sampled - The same run, sampled.
 * @param positions - Positions of the points, ends included.
 * @param stepMm - The step, used as the margin around each gap.
 * @returns The gap index and how far it strays, mm.
 */
function worstGap(
  segments: ReadonlyPath,
  sampled: SampledRun,
  positions: readonly number[],
  stepMm: number,
): { index: number; strayMm: number } {
  const curve = connectionCurve(positions.map((s) => pointAtLength(segments, s)));
  let worst = { index: 0, strayMm: 0 };
  curve.forEach((gap, index) => {
    const nearby = samplesBetween(sampled, positions[index]! - stepMm, positions[index + 1]! + stepMm);
    const strayMm = Math.max(
      ...samplePath([gap], CUT_CONNECTION_SAMPLES_PER_GAP).map((p) => distancePointToPolyline(p, nearby)),
    );
    if (strayMm > worst.strayMm) worst = { index, strayMm };
  });
  return worst;
}

/**
 * The offset points inside a curve run. Gaps are equal and never longer than the step (decision 284 item 2). Where a
 * smooth curve through them would stray more than CUT_CURVE_TOLERANCE_MM from the cut line (a tight bend, such as a
 * rounded collar end), the worst gap is halved by an extra point, again until it fits (item 8).
 * A straight run has none.
 *
 * @param run - The run.
 * @param stepMm - The largest gap, mm.
 * @returns The inner points, in walking order (the corners at both ends are not included).
 * @example
 * curvePoints(semicircleOf157mm, 25).length // 6 (7 gaps of 22.4 mm)
 */
export function curvePoints(run: CutRun, stepMm: number): Point[] {
  if (run.kind === "straight") return [];
  const length = pathLength(run.segments);
  const gaps = Math.max(1, Math.ceil(length / stepMm - GEOMETRY_EPSILON_MM));
  const positions = Array.from({ length: gaps + 1 }, (_, i) => (length * i) / gaps);
  const sampled = sampleRun(run.segments);
  for (let refinement = 0; refinement < CUT_CURVE_MAX_REFINEMENTS && positions.length > 2; refinement += 1) {
    const worst = worstGap(run.segments, sampled, positions, stepMm);
    if (worst.strayMm <= CUT_CURVE_TOLERANCE_MM) break;
    positions.splice(worst.index + 1, 0, (positions[worst.index]! + positions[worst.index + 1]!) / 2);
  }
  return positions.slice(1, -1).map((s) => pointAtLength(run.segments, s));
}
