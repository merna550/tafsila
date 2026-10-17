/**
 * Derived lengths and proportion checks of the bodice block (issue #128).
 * Aldrich 6th ed., ch. 2, bodice block, "Missing lengths" (docs/engine/drafting-method.md).
 */
import { DraftingError, type BodiceErrorCode } from "../../errors/drafting-error";
import {
  BACK_NECK_RISE_MM,
  BACK_SHOULDER_EASE_MM,
  BACK_WIDTH_RATIO,
  BODICE_DART_SHARE,
  BUST_DART_RATIO,
  CHEST_WIDTH_RATIO,
  FRONT_NECK_DEPTH_ADD_MM,
  FRONT_SHOULDER_SLOPE,
  MIN_DART_LENGTH_MM,
  MIN_DART_TO_SIDE_MM,
  MIN_SHOULDER_RUN_MM,
  MIN_SIDE_SEAM_MM,
  MIN_WAIST_DART_MM,
  NECK_WIDTH_DEDUCT_MM,
  NECK_WIDTH_DIVISOR,
  SCYE_DEPTH_BASE_MM,
  SCYE_DEPTH_BUST_SHARE,
} from "../../constants/bodice";
import { distance } from "../../geometry";
import type { BackPoints, BodiceInput, BodiceLengths, FrontPoints } from "./types";

/**
 * Waist dart width and side seam x (method, back step 7). The dart takes its share of the shaping; a dart
 * narrower than `MIN_WAIST_DART_MM`, or no dart in the design, gives 0 and the side seam takes it all.
 *
 * @param input - Bodice input.
 * @returns Dart width and side waist x in mm.
 */
function waistShaping(input: BodiceInput): { dartMm: number; sideXMm: number } {
  const shaping = input.bustQuarterMm - input.bodiceWaistQuarterMm;
  const raw = shaping * BODICE_DART_SHARE;
  const dartMm = input.waistDarts && raw >= MIN_WAIST_DART_MM ? raw : 0;
  return { dartMm, sideXMm: input.bodiceWaistQuarterMm + dartMm };
}

/**
 * Derives every length the drafting steps need. Aldrich 6th ed., ch. 2, bodice block, steps 1 to 9
 * (docs/engine/drafting-method.md, "Missing lengths"); back shoulder per decision 128, 1.
 *
 * @param input - Bodice input.
 * @returns The derived lengths in mm.
 */
export function deriveBodiceLengths(input: BodiceInput): BodiceLengths {
  const neckWidthMm = input.neck / NECK_WIDTH_DIVISOR - NECK_WIDTH_DEDUCT_MM;
  const shoulderRunMm = input.shoulderWidth / 2 - neckWidthMm;
  const frontShoulderLengthMm = Math.hypot(shoulderRunMm, shoulderRunMm * FRONT_SHOULDER_SLOPE);
  const scyeDepthMm = input.bust * SCYE_DEPTH_BUST_SHARE + SCYE_DEPTH_BASE_MM;
  const { dartMm, sideXMm } = waistShaping(input);
  return {
    neckWidthMm,
    frontNeckDepthMm: input.neck / NECK_WIDTH_DIVISOR + FRONT_NECK_DEPTH_ADD_MM,
    shoulderRunMm,
    frontShoulderLengthMm,
    backShoulderLengthMm: frontShoulderLengthMm + BACK_SHOULDER_EASE_MM,
    scyeDepthMm,
    scyeYMm: BACK_NECK_RISE_MM + scyeDepthMm,
    backWidthHalfMm: (input.bust * BACK_WIDTH_RATIO + input.acrossBackStyleEaseMm) / 2,
    chestWidthHalfMm: (input.bust * CHEST_WIDTH_RATIO) / 2,
    bustDartMm: input.bust * BUST_DART_RATIO,
    waistDartMm: dartMm,
    sideWaistXMm: sideXMm,
    backWaistYMm: BACK_NECK_RISE_MM + input.backLength,
  };
}

/**
 * Throws a bodice input error.
 *
 * @param code - The error code.
 * @param message - English explanation for logs.
 * @throws {DraftingError} Always.
 */
function refuse(code: BodiceErrorCode, message: string): never {
  throw new DraftingError(code, message);
}

/**
 * Checks the shoulder before any point is drafted.
 *
 * @param lengths - Derived lengths.
 * @throws {DraftingError} BODICE_SHOULDER_INVALID when the shoulder run is shorter than `MIN_SHOULDER_RUN_MM`.
 */
export function checkShoulder(lengths: BodiceLengths): void {
  if (lengths.shoulderRunMm < MIN_SHOULDER_RUN_MM) {
    refuse("BODICE_SHOULDER_INVALID", `Shoulder run ${lengths.shoulderRunMm.toFixed(1)} mm is too short`);
  }
}

/**
 * Checks that the drafted key points make a block that can be sewn: long enough side seams, the bust point
 * below the neck, darts long enough and the front waist dart clear of the side seam.
 *
 * @param back - Back key points.
 * @param front - Front key points.
 * @throws {DraftingError} BODICE_LENGTHS_INVALID or BODICE_BUST_POINT_OUT_OF_BLOCK.
 */
export function checkProportions(back: BackPoints, front: FrontPoints): void {
  const backSide = back.sideWaist.y - back.underarm.y;
  const frontSide = front.sideWaist.y - front.bustDartLower.y;
  if (Math.min(backSide, frontSide) < MIN_SIDE_SEAM_MM) {
    refuse("BODICE_LENGTHS_INVALID", `Side seam ${Math.min(backSide, frontSide).toFixed(1)} mm is too short`);
  }
  const waistDart = Math.min(front.waistDartLeft.y, front.waistDartRight.y) - front.waistDartApex.y;
  const bustDart = distance(front.bustDartApex, front.bustDartUpper);
  const toSide = front.sideWaist.x - front.waistDartRight.x;
  const bad =
    front.bustPoint.y <= front.neckCF.y ||
    waistDart < MIN_DART_LENGTH_MM ||
    bustDart < MIN_DART_LENGTH_MM ||
    toSide < MIN_DART_TO_SIDE_MM;
  if (bad) {
    refuse(
      "BODICE_BUST_POINT_OUT_OF_BLOCK",
      `Bust point does not fit: waist dart ${waistDart.toFixed(1)} mm, bust dart ${bustDart.toFixed(1)} mm, ${toSide.toFixed(1)} mm to the side seam`,
    );
  }
}
