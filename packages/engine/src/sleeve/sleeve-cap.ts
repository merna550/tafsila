/** Sleeve drafting: fitting a set-in sleeve cap to the bodice armhole (SRS FR-VAL-02). */
import { DraftingError } from "../errors/drafting-error";
import { type CubicBezier, sampleCubic } from "../geometry/bezier";
import { type Point, polylineLength, pt } from "../geometry/point";

/** Lowest and highest sleeve-cap heights the solver will consider, in mm. */
export const MIN_CAP_HEIGHT_MM = 50;
export const MAX_CAP_HEIGHT_MM = 250;
/** Stop the search when the cap length is within this distance of the target, in mm. */
const CAP_TOLERANCE_MM = 0.1;
/** Safety limit on solver iterations (bisection halves the range each time). */
const MAX_ITERATIONS = 60;

/** Relative positions of the S-curve control points (fractions of half-bicep width / cap height). */
const CAP_SHAPE = {
  upperX: 0.17,
  upperInnerX: 0.35,
  upperInnerY: 0.15,
  midX: 0.5,
  midY: 0.42,
  lowerX: 0.79,
  lowerInnerX: 0.62,
  lowerInnerY: 0.62,
};

/**
 * Builds one half of a sleeve cap (underarm → shoulder point) as two cubic curves forming an S shape.
 * The full cap is this half mirrored; both halves have the same length.
 *
 * @param halfBicepMm - Half of the sleeve width at the bicep line, in mm.
 * @param capHeightMm - Vertical distance from bicep line to cap top, in mm.
 * @returns Sampled points from the underarm (x = halfBicep, y = capHeight) to the cap top (0, 0).
 */
export function buildHalfCap(halfBicepMm: number, capHeightMm: number): Point[] {
  const w = halfBicepMm;
  const h = capHeightMm;
  const mid = pt(w * CAP_SHAPE.midX, h * CAP_SHAPE.midY);
  const lower: CubicBezier = {
    p0: pt(w, h),
    p1: pt(w * CAP_SHAPE.lowerX, h),
    p2: pt(w * CAP_SHAPE.lowerInnerX, h * CAP_SHAPE.lowerInnerY),
    p3: mid,
  };
  const upper: CubicBezier = {
    p0: mid,
    p1: pt(w * CAP_SHAPE.upperInnerX, h * CAP_SHAPE.upperInnerY),
    p2: pt(w * CAP_SHAPE.upperX, 0),
    p3: pt(0, 0),
  };
  return [...sampleCubic(lower), ...sampleCubic(upper).slice(1)];
}

/**
 * Total cap seam length (both halves) for a given cap height.
 *
 * @param halfBicepMm - Half of the bicep width, in mm.
 * @param capHeightMm - Cap height, in mm.
 * @returns Full cap seam length, in mm.
 */
export function capLength(halfBicepMm: number, capHeightMm: number): number {
  return 2 * polylineLength(buildHalfCap(halfBicepMm, capHeightMm));
}

/** Inputs for {@link solveSleeveCapHeight}. */
export interface SleeveCapInput {
  /** Front + back armhole seam length of the bodice, in mm. */
  readonly armholeLengthMm: number;
  /** Sleeve width at the bicep line including ease, in mm. */
  readonly bicepWidthMm: number;
  /** Extra cap length to ease into the armhole, in mm (woven fabrics: 10–40). */
  readonly capEaseMm: number;
}

/**
 * Finds the sleeve-cap height that makes the cap seam longer than the armhole by the requested ease,
 * so a set-in sleeve can be eased into the bodice (SRS FR-VAL-02).
 * Cap length grows monotonically with height, so bisection always converges.
 *
 * @param input - Armhole length, bicep width and desired cap ease (all mm).
 * @returns Cap height in mm.
 * @throws {DraftingError} SLEEVE_CAP_UNSOLVABLE if no height in [MIN_CAP_HEIGHT_MM, MAX_CAP_HEIGHT_MM] fits.
 * @example
 * solveSleeveCapHeight({ armholeLengthMm: 420, bicepWidthMm: 340, capEaseMm: 20 }) // ≈ 126
 */
export function solveSleeveCapHeight(input: SleeveCapInput): number {
  const half = input.bicepWidthMm / 2;
  const target = input.armholeLengthMm + input.capEaseMm;
  let low = MIN_CAP_HEIGHT_MM;
  let high = MAX_CAP_HEIGHT_MM;
  if (target < capLength(half, low) || target > capLength(half, high)) {
    throw new DraftingError(
      "SLEEVE_CAP_UNSOLVABLE",
      `No cap height fits a ${target} mm cap for bicep ${input.bicepWidthMm} mm`,
    );
  }
  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    const mid = (low + high) / 2;
    const length = capLength(half, mid);
    if (Math.abs(length - target) <= CAP_TOLERANCE_MM) return mid;
    if (length < target) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
