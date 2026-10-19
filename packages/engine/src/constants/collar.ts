/**
 * Collar constants (issue #141, decision 141). All in mm. Source: Aldrich 6th ed., ch. 5 (collars: "Flat collars",
 * "Shirt collar with stand", "Mandarin collar"), tuned on the reference drafts; pending sew-test.
 */

/** Peter pan: the back shoulder overlaps the front by this much at the shoulder tip, giving the collar its roll. */
export const PETER_PAN_SHOULDER_OVERLAP_MM = 13;

/** Peter pan: finished width of the collar from the neck seam to the outer edge. */
export const PETER_PAN_WIDTH_MM = 70;

/** Peter pan: radius of the rounded front end (and of the back end when the collar opens at centre back). */
export const PETER_PAN_FRONT_RADIUS_MM = 30;

/** Peter pan: where the back and front outer edges meet above the shoulder, each is blended over this length. */
export const PETER_PAN_SHOULDER_BLEND_MM = 30;

/** Turn of cloth: the under collar's outer edge is trimmed this much so the seam rolls under (Aldrich, collars). */
export const COLLAR_TURN_OF_CLOTH_MM = 3;

/** Shirt: finished height of the stand at centre back. */
export const SHIRT_STAND_HEIGHT_MM = 30;

/** Shirt: how far the stand's neck edge rises at centre front above its straight line. */
export const SHIRT_STAND_CF_RISE_MM = 10;

/** Shirt: finished width of the collar fall at centre back. */
export const SHIRT_COLLAR_WIDTH_MM = 45;

/** Shirt: how far the collar point runs out past centre front. */
export const SHIRT_COLLAR_POINT_OUT_MM = 15;

/** Shirt: length of the collar point edge, from the stand seam at the front to the tip. */
export const SHIRT_COLLAR_POINT_LENGTH_MM = 70;

/** Shirt: the fall's outer edge leaves the point and reaches CB with handles this share of its run. */
export const SHIRT_COLLAR_HANDLE_SHARE = 0.333;

/** Mandarin: finished height of the stand at centre back. */
export const MANDARIN_HEIGHT_MM = 35;

/** Mandarin: how far the stand's neck edge rises at the front above its straight line. */
export const MANDARIN_CF_RISE_MM = 15;

/** Mandarin: radius of the rounded top corner at the open end. */
export const MANDARIN_END_RADIUS_MM = 15;

/** Stand: radius of the rounded end of the button extension. */
export const STAND_EXTENSION_RADIUS_MM = 10;

/** Stand: the neck curve's first handle runs this share of its horizontal run (flat start, Aldrich stand curve). */
export const STAND_C1_RUN_SHARE = 0.5;

/** Stand: the second handle sits this share of the run along, so the curve lifts late. */
export const STAND_C2_RUN_SHARE = 0.75;

/** Stand: the second handle sits this share of the rise up, so the front end leaves at a moderate angle. */
export const STAND_C2_RISE_SHARE = 0.5;

/** The collar grain line runs parallel to the fold (or the centre back), this far inside it. */
export const COLLAR_GRAIN_FROM_END_MM = 15;

/** The collar grain line stops this far short of the neck and outer edges. */
export const COLLAR_GRAIN_INSET_MM = 5;

/** On a narrow end the grain line inset is at most this share of the end's length from each edge. */
export const COLLAR_GRAIN_MAX_INSET_SHARE = 0.25;

/** A cubic approximating a circular arc of turn φ has handles (4/3)·tan(φ/4)·r / tan(φ/2) long per tangent length r. */
export const CUBIC_ARC_FACTOR = 1.3333333333333333;

/** Collars made of a stand: they sit on the natural neck and their inner stand replaces the neck facings. */
export const STAND_COLLARS: ReadonlySet<string> = new Set(["shirt", "mandarin"]);
