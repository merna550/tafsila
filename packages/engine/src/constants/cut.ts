/** Constants of the direct-cut marking steps (issue #284, FR-CUT-01, FR-CUT-02, decision 284). Lengths in mm. */

/** Default gap between the offset points of a curve: the screens and FR-CUT-02 say every 25 mm. */
export const CUT_CURVE_STEP_DEFAULT_MM = 25;

/** Smallest gap the user may pick (FR-CUT-02): closer points only add steps without a visible gain. */
export const CUT_CURVE_STEP_MIN_MM = 20;

/** Largest gap the user may pick (FR-CUT-02): wider gaps let a hand-drawn curve drift more than 1 mm. */
export const CUT_CURVE_STEP_MAX_MM = 30;

/**
 * A turn of the cut line sharper than this, in degrees, is a corner. Smooth joins between cubics turn by about 0°,
 * mitred seam-allowance corners by 30° or more, so 15° sits well between the two.
 */
export const CUT_CORNER_ANGLE_DEG = 15;

/**
 * Where two straight lines meet, a turn sharper than this, in degrees, is a corner: a ruler cannot follow a kink, and a
 * 1° kink drifts less than 0.5 mm over 30 mm. Gentle kinks between lines (a side seam bent by a dart, 4-10°) were
 * smoothed over by the 15° rule and missed the 1 mm check.
 */
export const CUT_LINE_KINK_ANGLE_DEG = 1;

/** A fold edge may bend this far from its end-to-end line, in mm, and still be a straight fold to lay on the fabric. */
export const CUT_FOLD_STRAIGHT_TOLERANCE_MM = 0.1;

/** A run of lines whose points stay this close to its chord, in mm, is one straight line to draw with a ruler. */
export const CUT_STRAIGHT_TOLERANCE_MM = 0.1;

/** Straight pieces per cubic when the cut line is sampled to find the frame's extremes (finer than the default 32). */
export const CUT_FRAME_SAMPLES_PER_CURVE = 64;

/**
 * A smooth curve through the marked points may stray this far from the cut line, in mm, before the engine adds a point
 * on a tight bend. It leaves a margin under the 1 mm accuracy target (NFR-01) for sampling and drawing.
 */
export const CUT_CURVE_TOLERANCE_MM = 0.75;

/** Most points the engine adds to one curve for tight bends; far above what the catalogue needs (at most a few). */
export const CUT_CURVE_MAX_REFINEMENTS = 24;

/** Straight pieces per gap when a smooth connection is sampled to measure how far it strays. */
export const CUT_CONNECTION_SAMPLES_PER_GAP = 12;
