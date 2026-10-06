/** Cubic Bézier curves: the shape of armholes, necklines and sleeve caps. */
import type { Point } from "./point";
import { pt } from "./point";

/** Default number of samples when turning a curve into a polyline (enough for sub-millimetre accuracy). */
export const DEFAULT_CURVE_SAMPLES = 64;

/** Binomial coefficient of the two middle terms of a cubic Bernstein polynomial. */
const CUBIC_COEFFICIENT = 3;

/** A cubic Bézier curve defined by its start, two control points and end. */
export interface CubicBezier {
  /** Start point. */
  readonly p0: Point;
  /** First control point. */
  readonly p1: Point;
  /** Second control point. */
  readonly p2: Point;
  /** End point. */
  readonly p3: Point;
}

/**
 * Evaluates a cubic Bézier at parameter t.
 *
 * @param curve - The curve.
 * @param t - Position along the curve, 0 (start) to 1 (end).
 * @returns The point on the curve.
 */
export function pointOnCubic(curve: CubicBezier, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = CUBIC_COEFFICIENT * u * u * t;
  const c = CUBIC_COEFFICIENT * u * t * t;
  const d = t * t * t;
  return pt(
    a * curve.p0.x + b * curve.p1.x + c * curve.p2.x + d * curve.p3.x,
    a * curve.p0.y + b * curve.p1.y + c * curve.p2.y + d * curve.p3.y,
  );
}

/**
 * Samples a cubic Bézier into a polyline so it can be measured, offset and drawn.
 *
 * @param curve - The curve.
 * @param samples - Number of segments (more = smoother); defaults to DEFAULT_CURVE_SAMPLES.
 * @returns Points from start to end inclusive.
 */
export function sampleCubic(curve: CubicBezier, samples: number = DEFAULT_CURVE_SAMPLES): Point[] {
  return Array.from({ length: samples + 1 }, (_, i) => pointOnCubic(curve, i / samples));
}
