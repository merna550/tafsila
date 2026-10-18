/** Constants of notches, grain lines and labels (issue #131, decision 131). */

/** Grain line length as a share of the piece height (a long line reads easily on the fabric). */
export const GRAIN_LINE_LENGTH_RATIO = 0.6;
/** Shortest grain line, in mm, so a small piece still gets a usable arrow. */
export const GRAIN_LINE_MIN_MM = 120;
/** Shortest grain line accepted by the finishing check, in mm: below this the line is degenerate. */
export const GRAIN_LINE_DEGENERATE_MM = 1;

/** How far a dart leg may sit from its edge, in mm (a dart is drawn on the stitch line). */
export const DART_LEG_TOLERANCE_MM = 0.1;

/** Largest label text height, in mm. */
export const LABEL_SIZE_MM = 8;
/** Smallest label text height, in mm; below this a label goes outside the piece. */
export const LABEL_MIN_SIZE_MM = 4;
/** Step by which the text height shrinks while searching, in mm. */
export const LABEL_SIZE_STEP_MM = 1;
/** Average glyph width as a share of the text height. The engine has no font metrics, so this is an estimate. */
export const LABEL_CHAR_WIDTH_RATIO = 0.6;
/** Distance between two label baselines as a share of the text height. */
export const LABEL_LINE_PITCH_RATIO = 1.4;
/** Share of the text height drawn below the baseline (descenders). */
export const LABEL_DESCENT_RATIO = 0.3;
/** Step of the grid searched for a label position, in mm. */
export const LABEL_GRID_MM = 5;
/** Number of times the best grid point is refined with a half step. */
export const LABEL_REFINE_ROUNDS = 2;
/** Most grid cells along the longer side of a piece in the first scan; larger pieces get a coarser first step. */
export const LABEL_MAX_GRID_CELLS = 60;
/** Least distance, in mm, between a label box and any stitch, cut or grain line. */
export const LABEL_CLEARANCE_MM = 3;

/** Side of the scale check square, in mm (10 cm). */
export const SCALE_SQUARE_SIZE_MM = 100;
/** Step of the scan for a place that holds the scale square, in mm. */
export const SCALE_SCAN_MM = 10;
/** Distance, in mm, kept between the scale square and the piece lines, labels and grain line. */
export const SCALE_CLEARANCE_MM = 2;
