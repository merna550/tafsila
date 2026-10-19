/**
 * Pocket constants (issue #145, decision 145). In mm unless the name says otherwise. Source: Aldrich, Metric Pattern
 * Cutting for Women's Wear, 6th ed., ch. 2 "Pockets" (side-seam and patch pockets); starting values pending sew-test.
 */

/** The side-seam opening starts this far below the waist, measured down the side seam. */
export const POCKET_OPENING_TOP_BELOW_WAIST_MM = 40;

/** Length of the side-seam opening (a hand passes in 160 mm). */
export const POCKET_OPENING_MM = 160;

/** The bag runs this far past each end of the opening, so the opening is held by the bag seam. */
export const POCKET_BAG_EXTENSION_MM = 20;

/** Depth of a pocket bag, from the side seam to its rounded outer edge. */
export const POCKET_BAG_DEPTH_MM = 180;

/** Radius of the two rounded corners of a pocket bag. */
export const POCKET_BAG_CORNER_RADIUS_MM = 40;

/** A pocket must end at least this far above the hem. */
export const POCKET_HEM_CLEARANCE_MM = 50;

/** Tolerance of the bag opening against the shell opening, in mm (SRS FR-VAL-04: notches within 2 mm). */
export const POCKET_OPENING_TOLERANCE_MM = 2;

/** Finished width of a patch pocket. */
export const PATCH_POCKET_WIDTH_MM = 150;

/** Finished height of a patch pocket. */
export const PATCH_POCKET_HEIGHT_MM = 170;

/** Fold of the patch pocket's top hem. */
export const PATCH_POCKET_HEM_MM = 30;

/** Turn-under of the other three edges of a patch pocket. */
export const PATCH_POCKET_TURN_UNDER_MM = 10;

/** The top of a patch pocket sits this far below the waist. */
export const PATCH_TOP_BELOW_WAIST_MM = 80;

/** The centre of a patch pocket sits at this share of the front half-width, from the centre line. */
export const PATCH_CENTRE_SHARE = 0.5;

/** Length of one corner line of the patch placement mark, in mm. */
export const PATCH_MARK_CORNER_MM = 20;

/** Share of a patch pocket's height its grain line spans. */
export const PATCH_GRAIN_SHARE = { from: 0.25, to: 0.75 } as const;

/** Share of a bag's width its grain line sits at, and the share of its length it spans. */
export const BAG_GRAIN = { widthShare: 0.33, from: 0.25, to: 0.75 } as const;
