/** Named numbers of the piece preparation, in mm (ADR-313). */

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
