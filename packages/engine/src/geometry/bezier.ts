/**
 * Cubic Bézier curves: the shape of armholes, necklines, hems and sleeve caps.
 * Methods: de Casteljau subdivision, Gravesen's adaptive length, Catmull-Rom interpolation (pomax.github.io/bezierinfo).
 */
import {
  CATMULL_ROM_HANDLE_RATIO,
  CURVE_LENGTH_TOLERANCE_MM,
  DIRECTION_EPSILON_MM,
  GEOMETRY_EPSILON_MM,
  MAX_BISECTION_STEPS,
  MAX_SUBDIVISION_DEPTH,
} from "../constants/geometry";
import { DraftingError } from "../errors/drafting-error";
import { type Point, add, distance, lerp, norm, normalize, pt, samePoint, scale, sub } from "./point";
import { type CubicSegment, assertSegment, cubicSeg } from "./segment";

/** Default number of samples when turning a curve into a polyline (enough for sub-millimetre accuracy). */
export const DEFAULT_CURVE_SAMPLES = 64;

/** Binomial coefficient of the two middle terms of a cubic Bernstein polynomial (and the derivative factor). */
const CUBIC_COEFFICIENT = 3;

/** Half of the parameter range, where a curve is split in two equal-parameter halves. */
const HALF = 0.5;

/** Parameter step used to find a direction where the derivative vanishes (a control point on an end point). */
const TANGENT_PROBE_T = 1e-4;

/**
 * Evaluates a cubic Bézier at parameter t (Bernstein form).
 *
 * @param curve - The curve.
 * @param t - Position along the curve, 0 (start) to 1 (end).
 * @returns The point on the curve.
 */
export function pointOnCubic(curve: CubicSegment, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = CUBIC_COEFFICIENT * u * u * t;
  const c = CUBIC_COEFFICIENT * u * t * t;
  const d = t * t * t;
  return pt(
    a * curve.from.x + b * curve.c1.x + c * curve.c2.x + d * curve.to.x,
    a * curve.from.y + b * curve.c1.y + c * curve.c2.y + d * curve.to.y,
  );
}

/**
 * First derivative of a cubic Bézier at t (speed and direction of travel).
 *
 * @param curve - The curve.
 * @param t - Parameter in [0, 1].
 * @returns The derivative vector, in mm per unit t.
 */
export function derivativeOnCubic(curve: CubicSegment, t: number): Point {
  const u = 1 - t;
  const d0 = scale(sub(curve.c1, curve.from), u * u);
  const d1 = scale(sub(curve.c2, curve.c1), 2 * u * t);
  const d2 = scale(sub(curve.to, curve.c2), t * t);
  return scale(add(add(d0, d1), d2), CUBIC_COEFFICIENT);
}

/**
 * Unit tangent (direction of travel) of a cubic at t. Where the derivative vanishes, the direction of the
 * nearby chord is used, so a control point placed on its end point still gives a tangent.
 *
 * @param curve - The curve.
 * @param t - Parameter in [0, 1].
 * @returns The unit tangent.
 * @throws {DraftingError} GEOMETRY_DEGENERATE_SEGMENT when the curve has no direction at all (a single point).
 */
export function tangentOnCubic(curve: CubicSegment, t: number): Point {
  const derivative = derivativeOnCubic(curve, t);
  if (norm(derivative) >= DIRECTION_EPSILON_MM) return normalize(derivative);
  const before = pointOnCubic(curve, Math.max(0, t - TANGENT_PROBE_T));
  const after = pointOnCubic(curve, Math.min(1, t + TANGENT_PROBE_T));
  return normalize(sub(after, before));
}

/**
 * Splits a cubic at t into two cubics that together trace the same curve (de Casteljau).
 *
 * @param curve - The curve.
 * @param t - Split parameter in [0, 1].
 * @returns The part before t and the part after t.
 */
export function splitCubic(curve: CubicSegment, t: number): [CubicSegment, CubicSegment] {
  const ab = lerp(curve.from, curve.c1, t);
  const bc = lerp(curve.c1, curve.c2, t);
  const cd = lerp(curve.c2, curve.to, t);
  const abc = lerp(ab, bc, t);
  const bcd = lerp(bc, cd, t);
  const mid = lerp(abc, bcd, t);
  return [cubicSeg(curve.from, ab, abc, mid), cubicSeg(mid, bcd, cd, curve.to)];
}

/**
 * Samples a cubic Bézier into a polyline so it can be drawn or turned into a polygon.
 *
 * @param curve - The curve.
 * @param samples - Number of straight pieces (more = smoother); defaults to DEFAULT_CURVE_SAMPLES.
 * @returns Points from start to end inclusive.
 */
export function sampleCubic(curve: CubicSegment, samples: number = DEFAULT_CURVE_SAMPLES): Point[] {
  return Array.from({ length: samples + 1 }, (_, i) => pointOnCubic(curve, i / samples));
}

/**
 * Length of a cubic piece, splitting it until chord and control net agree (Gravesen's estimate).
 *
 * @param curve - The piece.
 * @param depth - Current recursion depth.
 * @returns Length in mm.
 */
function adaptiveLength(curve: CubicSegment, depth: number): number {
  const chord = distance(curve.from, curve.to);
  const net = distance(curve.from, curve.c1) + distance(curve.c1, curve.c2) + distance(curve.c2, curve.to);
  if (net - chord <= CURVE_LENGTH_TOLERANCE_MM || depth >= MAX_SUBDIVISION_DEPTH) return (chord + net) / 2;
  const [left, right] = splitCubic(curve, HALF);
  return adaptiveLength(left, depth + 1) + adaptiveLength(right, depth + 1);
}

/**
 * Arc length of a cubic Bézier by adaptive subdivision, accurate to CURVE_LENGTH_TOLERANCE_MM.
 *
 * @param curve - The curve.
 * @returns Length in mm.
 * @example
 * cubicLength(cubicSeg(pt(0, 0), pt(10, 0), pt(20, 0), pt(30, 0))) // 30
 */
export function cubicLength(curve: CubicSegment): number {
  return adaptiveLength(curve, 0);
}

/**
 * Parameter t at which the curve has covered a given length from its start (bisection on the length).
 *
 * @param curve - The curve.
 * @param lengthMm - Distance along the curve from its start, in mm.
 * @returns t in [0, 1].
 * @throws {DraftingError} GEOMETRY_LENGTH_OUT_OF_RANGE when lengthMm is negative or longer than the curve.
 */
export function tAtLength(curve: CubicSegment, lengthMm: number): number {
  const total = cubicLength(curve);
  if (!(lengthMm >= -GEOMETRY_EPSILON_MM && lengthMm <= total + GEOMETRY_EPSILON_MM)) {
    throw new DraftingError("GEOMETRY_LENGTH_OUT_OF_RANGE", `${lengthMm} mm is outside a ${total} mm curve`);
  }
  if (lengthMm <= 0) return 0;
  if (lengthMm >= total) return 1;
  let low = 0;
  let high = 1;
  for (let step = 0; step < MAX_BISECTION_STEPS; step += 1) {
    const mid = (low + high) / 2;
    const length = cubicLength(splitCubic(curve, mid)[0]);
    if (Math.abs(length - lengthMm) <= CURVE_LENGTH_TOLERANCE_MM) return mid;
    if (length < lengthMm) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/**
 * Tangent vector at each point: the given unit directions at the ends (scaled by the end chord), Catmull-Rom inside.
 *
 * @param points - Points the curve passes through.
 * @param startDir - Unit direction at the first point.
 * @param endDir - Unit direction at the last point.
 * @returns One tangent vector per point.
 */
function catmullRomTangents(points: readonly Point[], startDir: Point, endDir: Point): Point[] {
  const last = points.length - 1;
  return points.map((p, i) => {
    if (i === 0) return scale(startDir, distance(p, points[1]!));
    if (i === last) return scale(endDir, distance(points[last - 1]!, p));
    return scale(sub(points[i + 1]!, points[i - 1]!), HALF);
  });
}

/**
 * Smooth curve through the given points with fixed end directions (Catmull-Rom spline as cubic Béziers).
 * Used for necklines, armholes and hems where the curve must meet a seam at a set angle.
 *
 * @param points - At least two distinct points the curve passes through, in order.
 * @param startTangent - Direction of travel at the first point (any length).
 * @param endTangent - Direction of travel at the last point (any length).
 * @returns One cubic per gap between consecutive points (a continuous path).
 * @throws {DraftingError} GEOMETRY_DEGENERATE_SEGMENT for fewer than two points, repeated points or a zero tangent.
 */
export function curveThroughPoints(
  points: readonly Point[],
  startTangent: Point,
  endTangent: Point,
): CubicSegment[] {
  if (points.length < 2 || points.some((p, i) => i > 0 && samePoint(points[i - 1]!, p))) {
    throw new DraftingError("GEOMETRY_DEGENERATE_SEGMENT", "A curve needs at least two distinct points");
  }
  const tangents = catmullRomTangents(points, normalize(startTangent), normalize(endTangent));
  const curves = points.slice(1).map((to, i) => {
    const from = points[i]!;
    const c1 = add(from, scale(tangents[i]!, CATMULL_ROM_HANDLE_RATIO));
    const c2 = sub(to, scale(tangents[i + 1]!, CATMULL_ROM_HANDLE_RATIO));
    return cubicSeg(from, c1, c2, to);
  });
  curves.forEach(assertSegment);
  return curves;
}
