/**
 * Elastic constants shared by the waist casing (issue #140) and the elastic sleeve cuff (issue #142). All in mm unless
 * the name says otherwise. Source: Aldrich 6th ed., ch. 2; pending sew-test.
 */

/** Room in a casing so the elastic slides through it once the casing is stitched. */
export const CASING_EASE_MM = 5;

/** Elastic cut length as a share of the body girth it sits on, join overlap included (Aldrich: 85 to 95 %). */
export const ELASTIC_LENGTH_RATIO = 0.9;
