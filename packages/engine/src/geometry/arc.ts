/**
 * Circular arcs as cubic Béziers, for the waist and hem of circle skirts (issue #136).
 * Method: the standard four-point approximation with handle length `4/3 · tan(sweep / 4) · r`
 * (pomax.github.io/bezierinfo, "Circles and cubic Bézier curves").
 */
import {
  ARC_HANDLE_ANGLE_DIVISOR,
  ARC_HANDLE_FACTOR,
  ARC_MAX_SWEEP_PER_CUBIC_RAD,
} from "../constants/geometry";
import { DraftingError } from "../errors/drafting-error";
import { type Point, pt } from "./point";
import { type CubicSegment, cubicSeg } from "./segment";

/** A circular arc: centre, radius and the start and end angles (x = cx + r·cos a, y = cy + r·sin a). */
export interface Arc {
  /** Circle centre. */
  readonly center: Point;
  /** Radius in mm. */
  readonly radiusMm: number;
  /** Start angle in radians. */
  readonly fromRad: number;
  /** End angle in radians; smaller than the start for a clockwise arc. */
  readonly toRad: number;
}

/**
 * The point at a standard angle on a circle.
 *
 * @param center - Circle centre.
 * @param radiusMm - Radius in mm.
 * @param angleRad - Angle in radians.
 * @returns The point on the circle.
 */
export function pointOnCircle(center: Point, radiusMm: number, angleRad: number): Point {
  return pt(center.x + radiusMm * Math.cos(angleRad), center.y + radiusMm * Math.sin(angleRad));
}

/**
 * Approximates a circular arc by cubic Béziers of equal sweep, each at most `maxSweepRad`. End points are computed
 * once and shared, so consecutive cubics join exactly.
 *
 * @param arc - The arc.
 * @param maxSweepRad - Largest sweep per cubic; defaults to `ARC_MAX_SWEEP_PER_CUBIC_RAD`.
 * @returns The cubics in order from the start angle to the end angle.
 * @throws {DraftingError} GEOMETRY_DEGENERATE_SEGMENT for a non-positive radius, a zero sweep or non-finite input.
 * @example
 * arcToCubics({ center: pt(0, 0), radiusMm: 100, fromRad: 0, toRad: Math.PI / 2 }) // two cubics
 */
export function arcToCubics(arc: Arc, maxSweepRad: number = ARC_MAX_SWEEP_PER_CUBIC_RAD): CubicSegment[] {
  const { center, radiusMm, fromRad, toRad } = arc;
  const sweepRad = toRad - fromRad;
  const valid = radiusMm > 0 && Number.isFinite(sweepRad) && sweepRad !== 0 && maxSweepRad > 0;
  if (!valid || !Number.isFinite(radiusMm) || !Number.isFinite(center.x) || !Number.isFinite(center.y)) {
    throw new DraftingError(
      "GEOMETRY_DEGENERATE_SEGMENT",
      `Cannot draw an arc of radius ${radiusMm} mm over ${sweepRad} rad`,
    );
  }
  const count = Math.ceil(Math.abs(sweepRad) / maxSweepRad);
  const stepRad = sweepRad / count;
  const handleMm = ARC_HANDLE_FACTOR * Math.tan(stepRad / ARC_HANDLE_ANGLE_DIVISOR) * radiusMm;
  const angles = Array.from({ length: count + 1 }, (_, i) => (i === count ? toRad : fromRad + stepRad * i));
  const ends = angles.map((a) => pointOnCircle(center, radiusMm, a));
  return ends.slice(0, -1).map((from, i) => {
    const to = ends[i + 1]!;
    const a0 = angles[i]!;
    const a1 = angles[i + 1]!;
    const c1 = pt(from.x - handleMm * Math.sin(a0), from.y + handleMm * Math.cos(a0));
    const c2 = pt(to.x + handleMm * Math.sin(a1), to.y - handleMm * Math.cos(a1));
    return cubicSeg(from, c1, c2, to);
  });
}
