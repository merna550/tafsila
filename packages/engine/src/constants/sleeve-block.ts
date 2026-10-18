/** Named constants of the set-in sleeve block (issue #134, decision 134-set-in-sleeve). All lengths in mm. */
import { SLEEVE_CAP_EASE_MAX_MM, SLEEVE_CAP_EASE_MIN_MM } from "./validation";

/**
 * Cap ease the solver aims for: the middle of the FR-VAL-02 range, so the drafted cap keeps 15 mm of margin on
 * both sides while validation still enforces the whole range (decision 134, 2).
 */
export const SLEEVE_CAP_TARGET_EASE_MM = (SLEEVE_CAP_EASE_MIN_MM + SLEEVE_CAP_EASE_MAX_MM) / 2;

/**
 * Elbow line below the cap top: half the sleeve length plus this value. Aldrich 6th ed., ch. 2, "Sleeve block"
 * (elbow line at half the sleeve length plus 3 cm).
 */
export const SLEEVE_ELBOW_BELOW_HALF_LENGTH_MM = 30;

/** A `cap` length sleeve ends this far below the underarm line: just covers the armpit (decision 134, 5). */
export const SLEEVE_CAP_LENGTH_BELOW_UNDERARM_MM = 40;

/**
 * A `short` sleeve ends this far below the underarm line, about mid upper arm. Like `cap`, it hangs from the
 * underarm line because the solved cap height varies more between bodies than a share of the arm length allows
 * (decision 134, 5).
 */
export const SLEEVE_SHORT_BELOW_UNDERARM_MM = 70;

/**
 * Hem height of the `three-quarter` and `long` sleeves as a share of the arm length (shoulder to wrist):
 * `three-quarter` ends about mid forearm (decision 134, 5).
 */
export const SLEEVE_LENGTH_SHARE = {
  threeQuarter: 0.78,
  long: 1,
} as const;

/** Smallest underarm seam, in mm: a hem closer than this to the underarm line cannot be sewn or hemmed. */
export const SLEEVE_MIN_UNDERARM_SEAM_MM = 30;

/**
 * Front balance notch: this far up the armhole from the underarm, on the bodice and on the cap. No ease is
 * placed below it, so both sides match from the underarm (decision 134, 3).
 */
export const SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM = 75;

/** First back balance notch, this far up the back armhole from the underarm (decision 134, 3). */
export const SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM = 90;

/** Gap between the two marks of the back double notch. */
export const SLEEVE_DOUBLE_NOTCH_GAP_MM = 6;

/** The grain line stops this far from the cap top and from the hem. */
export const SLEEVE_GRAIN_END_INSET_MM = 30;
