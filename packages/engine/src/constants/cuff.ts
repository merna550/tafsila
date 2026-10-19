/**
 * Sleeve cuff constants (issue #142, decision 142, 5 and 6). All in mm. Source: Aldrich 6th ed., ch. 2 (cuffs and
 * openings); starting values pending sew-test.
 */

/** Ease of a band cuff over the limb where it sits, so it slides and does not grip. */
export const CUFF_BAND_EASE_MM = 20;

/** Finished width of a band cuff: deep at the wrist (three-quarter, long), narrow on the arm (cap, short, elbow). */
export const CUFF_BAND_WIDTH_MM = { wrist: 50, arm: 30 } as const;

/** Overlap of an open wrist cuff past its sewn edge, for the button and buttonhole (#143). */
export const CUFF_OVERLAP_MM = 20;

/** Length of the slit cut up from the hem of a sleeve with an open wrist cuff (Aldrich: 70 to 80). */
export const CUFF_SLIT_LENGTH_MM = 75;

/** Width of the strip that binds the slit (cut twice the slit long). */
export const CUFF_PLACKET_WIDTH_MM = 30;

/** Width of the cuff elastic (10 mm is the common Egyptian market width for sleeves). */
export const CUFF_ELASTIC_WIDTH_MM = 10;
