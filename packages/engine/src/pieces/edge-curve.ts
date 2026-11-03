/** Tells a curved edge from a straight one and measures its arc depth and radius (issue #391). */
import type { Point, Segment } from "@tafsila/schemas";
import { cross, distance, dot, normalize, sampleCubic, sub, add, scale } from "../geometry";
import {
  CURVE_FLAT_TOLERANCE_MM,
  CURVE_MIN_CHORD_MM,
  CURVE_RADIUS_FIT_TOLERANCE_MM,
  CURVE_SAMPLES_PER_SEGMENT,
} from "../constants/dimensions";

/** What the dimension layer and the viewer need to know about one curved edge. */
export interface EdgeCurve {
  /** Largest distance between the edge and the straight line joining its two ends, in mm. */
  readonly depthMm: number;
  /** Radius of the circle the edge follows, in mm; undefined when the edge is not one circular arc. */
  readonly radiusMm?: number;
  /** Where the deepest point of the edge is, in piece coordinates. */
  readonly deepest: Point;
  /** The point on the chord straight across from `deepest`; undefined for a closed edge (no chord). */
  readonly foot?: Point;
  /** First end of the edge. */
  readonly from: Point;
  /** Second end of the edge. */
  readonly to: Point;
}

/**
 * Points along the segments, from the start of the first to the end of the last.
 *
 * @param segments - The segments of one edge, in path order.
 * @returns Sample points; a line contributes its end, a cubic its sampled curve.
 */
function sampleEdge(segments: readonly Segment[]): Point[] {
  const first = segments[0]!;
  const rest = segments.flatMap((seg) =>
    seg.kind === "line" ? [seg.to] : sampleCubic(seg, CURVE_SAMPLES_PER_SEGMENT).slice(1),
  );
  return [first.from, ...rest];
}

/**
 * Centre of the circle through three points.
 *
 * @param a - First point.
 * @param b - Second point.
 * @param c - Third point.
 * @returns The centre, or undefined when the points are on one line.
 */
function circumcentre(a: Point, b: Point, c: Point): Point | undefined {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < Number.EPSILON) return undefined;
  const aa = a.x * a.x + a.y * a.y;
  const bb = b.x * b.x + b.y * b.y;
  const cc = c.x * c.x + c.y * c.y;
  return {
    x: (aa * (b.y - c.y) + bb * (c.y - a.y) + cc * (a.y - b.y)) / d,
    y: (aa * (c.x - b.x) + bb * (a.x - c.x) + cc * (b.x - a.x)) / d,
  };
}

/**
 * The radius of the circle through the two ends and the deepest point, when every sample lies on it.
 *
 * @param from - First end.
 * @param to - Second end.
 * @param deepest - Deepest point of the edge.
 * @param samples - All sample points of the edge.
 * @returns The radius in mm, or undefined when the edge is not one circular arc.
 */
function fittedRadiusMm(
  from: Point,
  to: Point,
  deepest: Point,
  samples: readonly Point[],
): number | undefined {
  const centre = circumcentre(from, deepest, to);
  if (!centre) return undefined;
  const radiusMm = distance(centre, from);
  const fits = samples.every(
    (p) => Math.abs(distance(centre, p) - radiusMm) <= CURVE_RADIUS_FIT_TOLERANCE_MM,
  );
  return fits ? radiusMm : undefined;
}

/**
 * The sample farthest from the chord (or from the start, for a closed edge).
 *
 * @param samples - Sample points of the edge.
 * @param from - First end of the edge.
 * @param axis - Unit direction of the chord; undefined for a closed edge.
 * @returns That point and its distance in mm.
 */
function deepestSample(
  samples: readonly Point[],
  from: Point,
  axis: Point | undefined,
): { deepest: Point; depthMm: number } {
  let best = { deepest: from, depthMm: 0 };
  for (const p of samples) {
    const depthMm = axis ? Math.abs(cross(axis, sub(p, from))) : distance(p, from);
    if (depthMm > best.depthMm) best = { deepest: p, depthMm };
  }
  return best;
}

/**
 * Measures an edge: whether it is a curve, how deep its arc is and, when it is one circular arc, its radius.
 * An edge is a curve only when it has a cubic segment and strays more than `CURVE_FLAT_TOLERANCE_MM` from its
 * chord, so a straight run of lines (even one with a corner) and a Bézier drawn flat are both straight.
 *
 * @param segments - The segments of one edge, in path order.
 * @returns The curve, or undefined for a straight edge or an empty one.
 * @example
 * edgeCurve(edgeSegments(piece, "armhole"))?.depthMm // 38.2
 */
export function edgeCurve(segments: readonly Segment[]): EdgeCurve | undefined {
  if (!segments.some((s) => s.kind === "cubic")) return undefined;
  const samples = sampleEdge(segments);
  const from = samples[0]!;
  const to = samples[samples.length - 1]!;
  const axis = distance(from, to) < CURVE_MIN_CHORD_MM ? undefined : normalize(sub(to, from));
  const { deepest, depthMm } = deepestSample(samples, from, axis);
  if (depthMm <= CURVE_FLAT_TOLERANCE_MM) return undefined;
  const radiusMm = axis ? fittedRadiusMm(from, to, deepest, samples) : undefined;
  const foot = axis ? add(from, scale(axis, dot(axis, sub(deepest, from)))) : undefined;
  return {
    depthMm,
    deepest,
    from,
    to,
    ...(radiusMm === undefined ? {} : { radiusMm }),
    ...(foot ? { foot } : {}),
  };
}
