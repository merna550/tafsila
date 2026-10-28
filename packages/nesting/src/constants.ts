/** Named numbers of the piece preparation and the placement, in mm (ADR-313, decision 316). */

/**
 * Douglas-Peucker tolerance for the flattened cut line, in mm (ADR-313 item 3: 0.5 and 1 mm change no strip by more
 * than 2 mm; 5 mm changes 6 of 88 runs by more than 1 cm). The outline is then pushed out by the same distance.
 */
export const SIMPLIFY_TOLERANCE_MM = 2;

/** Distance under which a point counts as lying on the fold line, in mm. */
export const FOLD_EPSILON_MM = 0.001;

/** The half turn a shape may take without directional nap, in degrees (ADR-312 item 4). */
export const HALF_TURN_DEG = 180;

/** Fewest corners of a polygon; a polygon this small is never simplified further. */
export const MIN_POLYGON_CORNERS = 3;

/**
 * Width of one strip column in the placement, in mm (ADR-313 item 2: 2 mm is about 2× slower for no general gain; 3 mm
 * keeps the slowest fixture under 3 s with a 4× CPU slowdown). Shapes are placed at multiples of this along x.
 */
export const SLICE_MM = 3;

/** Millimetres in a metre. */
export const MM_PER_M = 1000;

/** The length to buy is rounded up to this step, in mm (0.1 m; ADR-312 item 4). */
export const LENGTH_STEP_MM = 100;

/** Slack under which a length counts as an exact multiple of the step, in mm (decision 316 item 2). */
export const LENGTH_EPSILON_MM = 0.01;

/** The piece orders the placement tries, in the order they are tried and preferred on equal strips (ADR-313 item 1). */
export const PIECE_ORDERS = ["area", "width", "length"] as const;
