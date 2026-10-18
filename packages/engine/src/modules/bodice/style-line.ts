/**
 * Princess style-line curves (issue #138, decision 138, 3): one cubic per stretch, square to the bust line at the
 * bust level, and the side panel's curve trued to the length of the centre panel's so the seam sews flat.
 */
import type { Point } from "@tafsila/schemas";
import {
  PRINCESS_HANDLE_MAX_SHARE,
  PRINCESS_HANDLE_MIN_SHARE,
  PRINCESS_HANDLE_SHARE,
  PRINCESS_TRUE_STEPS,
} from "../../constants/bodice-shaping";
import {
  add,
  cubicLength,
  cubicSeg,
  distance,
  normalize,
  pt,
  scale,
  sub,
  type CubicSegment,
} from "../../geometry";

/** Straight down the page: the style line crosses the bust level square to it. */
const DOWN = pt(0, 1);

/** Where a style curve starts and ends, and the unit directions it leaves and arrives in. */
export interface StyleCurveEnds {
  /** Start point. */
  readonly from: Point;
  /** End point. */
  readonly to: Point;
  /** Unit direction the curve leaves `from` in. */
  readonly startDir: Point;
  /** Unit direction the curve arrives at `to` in. */
  readonly endDir: Point;
}

/**
 * One style-line cubic: both handles are `share` of the chord long, along the given end directions.
 * Aldrich 6th ed., ch. 3, princess line: a smooth curve through the bust point (decision 138, 3).
 *
 * @param ends - End points and directions.
 * @param share - Handle length over chord length.
 * @returns The cubic.
 */
export function styleCurve(ends: StyleCurveEnds, share: number = PRINCESS_HANDLE_SHARE): CubicSegment {
  const handleMm = distance(ends.from, ends.to) * share;
  return cubicSeg(
    ends.from,
    add(ends.from, scale(ends.startDir, handleMm)),
    sub(ends.to, scale(ends.endDir, handleMm)),
    ends.to,
  );
}

/**
 * The style curve between the given ends whose length is closest to a target: bisection on the handle share, which
 * lengthens the curve as it grows (0 is the straight chord). Out of reach, the nearest end of the range is kept and
 * the seam-match rule (FR-VAL-01) reports the difference; nothing is forced.
 *
 * @param ends - End points and directions.
 * @param targetMm - Length to match, in mm (the partner panel's curve).
 * @returns The trued cubic.
 */
export function trueStyleCurve(ends: StyleCurveEnds, targetMm: number): CubicSegment {
  /**
   * Length of the curve drawn with one handle share.
   *
   * @param share - Handle length over chord length.
   * @returns The curve length in mm.
   */
  const lengthAt = (share: number): number => cubicLength(styleCurve(ends, share));
  let low = PRINCESS_HANDLE_MIN_SHARE;
  let high = PRINCESS_HANDLE_MAX_SHARE;
  if (lengthAt(low) >= targetMm) return styleCurve(ends, low);
  if (lengthAt(high) <= targetMm) return styleCurve(ends, high);
  for (let step = 0; step < PRINCESS_TRUE_STEPS; step += 1) {
    const mid = (low + high) / 2;
    if (lengthAt(mid) < targetMm) low = mid;
    else high = mid;
  }
  return styleCurve(ends, (low + high) / 2);
}

/**
 * Ends of an upper style stretch: from the style start to the pivot, arriving square to the bust level.
 *
 * @param from - Style start.
 * @param pivot - The pivot.
 * @returns The curve ends.
 */
export function upperEnds(from: Point, pivot: Point): StyleCurveEnds {
  return { from, to: pivot, startDir: normalize(sub(pivot, from)), endDir: DOWN };
}

/**
 * Ends of a lower style stretch: from the pivot, leaving square to the bust level, to a waist dart leg.
 *
 * @param pivot - The pivot.
 * @param to - Waist dart leg end.
 * @returns The curve ends.
 */
export function lowerEnds(pivot: Point, to: Point): StyleCurveEnds {
  return { from: pivot, to, startDir: DOWN, endDir: normalize(sub(to, pivot)) };
}
