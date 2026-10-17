/* eslint-disable no-magic-numbers -- the ratios are written as the size-12 chart fractions of the method so a reviewer can read them against the book */
/**
 * Bodice block constants (issue #128). Lengths in mm; ratios and slopes are unitless.
 *
 * The method values follow docs/engine/drafting-method.md (Aldrich 6th ed., ch. 2, bodice block, ADR-122a)
 * and duplicate `DRAFT_CONSTANTS` of `@tafsila/test-fixtures` on purpose: the reference calculation is
 * independent code (#122). `bodice.test.ts` keeps both in step. The block ease (20 and 10 mm per quarter)
 * is not here: it arrives through the resolve widths (#126).
 */

/** The nape sits this far below the HPS level at the back (method, back step 1). */
export const BACK_NECK_RISE_MM = 20;
/** Armscye depth from the nape level is bust x share + this value (Aldrich size 12: 880 / 8 + 100 = 210). */
export const SCYE_DEPTH_BASE_MM = 100;
/** Share of the bust that adds to the armscye depth (one eighth, the slope of Aldrich's size chart). */
export const SCYE_DEPTH_BUST_SHARE = 1 / 8;
/** Whole back width as a share of the bust (Aldrich size 12: 356 / 880). */
export const BACK_WIDTH_RATIO = 356 / 880;
/** Whole chest width as a share of the bust (Aldrich size 12: 320 / 880). */
export const CHEST_WIDTH_RATIO = 320 / 880;
/** Neck width is neck / 5 minus this value (the book's neck / 5 rule). */
export const NECK_WIDTH_DEDUCT_MM = 2;
/** Neck width is the neck circumference divided by this (the book's neck / 5 rule). */
export const NECK_WIDTH_DIVISOR = 5;
/** Front neck depth is neck / 5 plus this value (method, front step 2). */
export const FRONT_NECK_DEPTH_ADD_MM = 10;
/** Back shoulder slope: drop per mm of horizontal run (about 20 degrees). */
export const BACK_SHOULDER_SLOPE = 0.36;
/** Front shoulder slope: drop per mm of horizontal run (about 22 degrees). */
export const FRONT_SHOULDER_SLOPE = 0.4;
/** Bust dart opening at the side seam as a share of the bust (Aldrich size 12: 25 / 880). */
export const BUST_DART_RATIO = 25 / 880;
/** Share of the bodice waist shaping taken by the waist dart; the side seam takes the rest. */
export const BODICE_DART_SHARE = 0.5;
/** Distance from the underarm point down the side seam to the upper bust dart leg. */
export const BUST_DART_BELOW_UNDERARM_MM = 20;
/** The front waist dart ends this far below the bust point. */
export const FRONT_DART_BELOW_BUST_MM = 25;
/** The width points sit this share of the way down from the shoulder tip to the armscye line. */
export const WIDTH_POINT_DROP_SHARE = 1 / 3;
/**
 * Back shoulder length minus front shoulder length (decision 128, 1). 0 until the toile: Aldrich eases or darts
 * a longer back shoulder, and 5-7 mm is one change here and in the reference.
 */
export const BACK_SHOULDER_EASE_MM = 0;
/** Bust dart apex: this far beyond the bust point towards the side seam (decision 128, 2). */
export const BUST_DART_APEX_SETBACK_MM = 25;

/** A waist dart narrower than this is dropped and the side seam takes all the shaping (decision 128, 7). */
export const MIN_WAIST_DART_MM = 6;
/** Back armhole guide point: distance from the width point/armscye corner along the 45 degree diagonal. */
export const ARMHOLE_BACK_DIAGONAL_MM = 25;
/** Front armhole guide point: as the back, smaller because the front armhole is more hollow. */
export const ARMHOLE_FRONT_DIAGONAL_MM = 20;
/** The grain line runs parallel to the centre line, this far from it. */
export const GRAIN_FROM_CENTRE_MM = 40;
/** The grain line starts this far below the neck and ends this far above the waist. */
export const GRAIN_END_INSET_MM = 30;

/** Shortest horizontal shoulder run (neck point to shoulder tip) that still drafts a shoulder. */
export const MIN_SHOULDER_RUN_MM = 40;
/** Shortest side seam (back underarm to waist, front lower bust dart leg to waist). */
export const MIN_SIDE_SEAM_MM = 60;
/** Shortest dart (apex to mouth) that still shapes the bust. */
export const MIN_DART_LENGTH_MM = 60;
/** Least room between the front waist dart and the side seam at the waist. */
export const MIN_DART_TO_SIDE_MM = 20;
/**
 * Neck curve, centre handle as a share of the neck width: about the quarter-ellipse Bezier constant 0.552, so
 * the neck leaves the centre line square and smooth (decision 128, 5).
 */
export const NECK_CURVE_HANDLE_RATIO = 0.55;
/**
 * Neck curve, shoulder handle: its control point drops this share of the neck depth below the HPS level. Below
 * 1 keeps the curve inside its box; 0.55 bent the back neck so tightly near the neck point that the 10 mm seam
 * allowance offset crossed itself (#128 with #130's finishing), 0.8 does not.
 */
export const NECK_SHOULDER_HANDLE_SHARE = 0.8;
