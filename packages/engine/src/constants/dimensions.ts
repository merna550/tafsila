/** Constants of the dimension layer: curve detection and label look (issue #391, decision 391). Lengths in mm. */

/**
 * An edge that strays less than this from the straight line between its ends counts as straight: a hand
 * cutter cannot see a bend under half a millimetre, and a flat Bézier is drawn as a line anyway.
 */
export const CURVE_FLAT_TOLERANCE_MM = 0.5;

/** An edge whose two ends are closer than this is closed (a loop): it has no chord, so no radius. */
export const CURVE_MIN_CHORD_MM = 0.01;

/**
 * How far a sample may sit from the fitted circle and still count as one circular arc, so a radius is quoted
 * only for true arcs (circle skirts) and not for a bust or neck curve whose radius changes along it.
 */
export const CURVE_RADIUS_FIT_TOLERANCE_MM = 1;

/** Straight pieces per Bézier segment when the depth and radius are measured (the viewer shares this). */
export const CURVE_SAMPLES_PER_SEGMENT = 32;

/** Text height of a dimension label, in mm: legible at 1:1 and small enough for a 100 mm edge. */
export const DIMENSION_TEXT_MM = 4.5;

/** How far a length label sits inside its edge, measured from the stitch line to the text baseline, in mm. */
export const DIMENSION_LABEL_OFFSET_MM = 4;

/** How far the curve words sit inside the edge: one text line (4.5 mm) and a 2.5 mm gap beyond the length label. */
export const DIMENSION_CURVE_LABEL_OFFSET_MM = 11;

/** Line width of the dimension marks (chord and depth line), in mm. */
export const DIMENSION_STROKE_MM = 0.2;

/** Dash and gap of the chord line of a curved edge, in mm. */
export const DIMENSION_CHORD_DASH = "1 1.5";

/** Smallest rotation, in degrees, that keeps text upright: a label turns at most a quarter turn either way. */
export const DIMENSION_MAX_TEXT_ANGLE_DEG = 90;

/** Words written beside the numbers: curve depth and radius (the dimension layer writes Arabic, like the labels). */
export const DIMENSION_WORDS = { depth: "قوس", radius: "نق" } as const;
