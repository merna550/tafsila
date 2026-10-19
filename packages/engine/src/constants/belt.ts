/**
 * Belt constants (issue #145, decision 145). In mm. Source: Aldrich 6th ed., ch. 2 "Belts and waistbands"; starting
 * values pending sew-test.
 */

/** The belt is the waist plus this ease before the ties. */
export const BELT_WAIST_EASE_MM = 20;

/** Length of each tie past the belt, in mm. */
export const BELT_TIE_LENGTH_MM = 450;

/** Finished width of the belt. */
export const BELT_WIDTH_MM = 40;

/** Tolerance of the joined belt length against the finished length (SRS FR-VAL-01). */
export const BELT_LENGTH_TOLERANCE_MM = 2;

/** The belt's grain line spans this share of the cut height (the strip is folded, so the cut height is twice the width). */
export const BELT_GRAIN_HEIGHT_SHARE = { from: 0.25, to: 0.75 } as const;
