/**
 * Waist finish constants (issue #140, decision 140): straight band, contour band, elastic casing and waist facing.
 * All in mm unless the name says otherwise. Source: Aldrich 6th ed., ch. 2 (skirt waistbands and facings), tuned on
 * the reference drafts; pending sew-test.
 */

/** Finished width of a straight waistband; the piece is cut twice this wide and folded along its length. */
export const STRAIGHT_BAND_WIDTH_MM = 35;

/** Underlap added past the band's end for a zip or button closure (Aldrich: 30 mm for a button or hook). */
export const CLOSURE_OVERLAP_MM = 30;

/** Finished width of a contour band, measured up from the waist seam (Aldrich: 50 to 75 mm). */
export const CONTOUR_BAND_WIDTH_MM = 50;

/** Depth of the waist facing below the waist seam when there is no band (Aldrich: 50 to 75 mm). */
export const WAIST_FACING_DEPTH_MM = 60;

/** Width of the waist elastic the casing is sized for (25 mm is the common Egyptian market width). */
export const ELASTIC_WIDTH_MM = 25;

/** Room in the casing so the elastic slides through it once the casing is stitched. */
export const CASING_EASE_MM = 5;

/** Elastic cut length as a share of the body waist, join overlap included (Aldrich: 85 to 95 % of the waist). */
export const ELASTIC_LENGTH_RATIO = 0.9;

/** Room the relaxed waist needs over the hip to be pulled on without straining the seams. */
export const HIP_PASS_EASE_MM = 20;

/** Share of the band length where a strip's grain line starts and ends. */
export const BAND_GRAIN_SHARE = { from: 0.25, to: 0.75 } as const;

/** Share of the band depth the grain line of a traced piece spans, from the sewn edge. */
export const TRACED_GRAIN_DEPTH_SHARE = { from: 0.25, to: 0.75 } as const;
