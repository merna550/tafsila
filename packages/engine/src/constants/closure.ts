/**
 * Closure constants (issue #141, shared with the closures of #143, decision 143). In mm unless the name says otherwise.
 * Source: Aldrich 6th ed., ch. 3 (button extensions, "Shirt collar with stand") and ch. 2 (zips in skirts and
 * dresses); starting values pending sew-test.
 */

/** Diameter of a front button: the extension past the centre front equals it (Aldrich: extension = button width). */
export const BUTTON_DIAMETER_MM = 15;

/** Button extension past the centre front for a button closure: stand collars run on by this much (#141). */
export const BUTTON_EXTENSION_MM = BUTTON_DIAMETER_MM;

/** Diameter of a cuff button (decision 142, 5: the 20 mm cuff overlap holds a 10 mm button). */
export const CUFF_BUTTON_DIAMETER_MM = 10;

/** A buttonhole is the button's diameter plus this, so the button passes through (Aldrich: 3 mm). */
export const BUTTONHOLE_EASE_MM = 3;

/** A horizontal buttonhole starts this far past the button's centre, towards the opening edge. */
export const BUTTONHOLE_PAST_CENTRE_MM = 3;

/** The top button's centre sits this far below the top of the opening (the neck seam line). */
export const BUTTON_FIRST_FROM_TOP_MM = 20;

/** The last button's centre sits this far above the bottom of the opening (the hem or waist seam line). */
export const BUTTON_LAST_FROM_BOTTOM_MM = 60;

/** Largest gap between two button centres; the count is the smallest that keeps every gap within it. */
export const BUTTON_MAX_SPACING_MM = 90;

/** Width of the separate front facing past the centre front, towards the side (the extension is added to it). */
export const FRONT_FACING_WIDTH_MM = 60;

/** Zip lengths per category and position, from the top of the opening; `full` runs the whole opening (open-ended). */
export const ZIP_LENGTH_MM = {
  dress: { "center-back": 560, side: 400, "center-front": 560 },
  skirt: { "center-back": 180, side: 180, "center-front": 180 },
  blouse: { "center-back": "full", side: "full", "center-front": "full" },
} as const;

/** A zip shorter than `full` must stop at least this far above the bottom of the opening seam. */
export const ZIP_END_CLEARANCE_MM = 50;

/** Seam allowance of every seam a zip is set into: wider than the 15 mm default to hold the tape (Aldrich: 20). */
export const ZIP_SEAM_ALLOWANCE_MM = 20;

/** Width of a zip tape, for the notion (a standard 3 mm coil zip). */
export const ZIP_TAPE_WIDTH_MM = 25;

/** Zip lengths are bought in whole centimetres: a full-length zip is rounded down to this step. */
export const ZIP_LENGTH_STEP_MM = 10;
