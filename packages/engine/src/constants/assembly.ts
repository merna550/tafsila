/** Constants of garment assembly (issue #144, decision 144-garment-assembly). */

/**
 * Run order of the assembly modules: after the bodice shaping (5), skirts (10–30), sleeves (30–31) and the waistband
 * (40), before the closure (50), so the zip and the buttons see the final pieces.
 */
export const ASSEMBLY_ORDER = 45;

/**
 * How far a blouse hem sits below the hip line, in mm. 0: hip length, worn over or tucked in (decision 144, 5);
 * the spec has no tuck-in/over field yet.
 */
export const BLOUSE_LENGTH_BELOW_HIP_MM = 0;

/** Waist seam lengths (bodice and skirt, darts closed) match within this, in mm (FR-VAL-01 seam tolerance). */
export const WAIST_SEAM_TOLERANCE_MM = 2;

/** Front and back side seams of a one-piece half are trued until they differ by at most this, in mm (well inside FR-VAL-01). */
export const ASSEMBLY_TRUING_TOLERANCE_MM = 0.01;

/** Most truing steps; the side seam grows almost 1:1 with the move, so a few steps reach the tolerance. */
export const ASSEMBLY_TRUING_MAX_STEPS = 20;

/**
 * Clearance between the lower apex of a fisheye dart and the hip row, in mm: the dart must close above the widest
 * part of the hip, which the skirt method's dart lengths respect for every body in range (decision 144, 4).
 */
export const FISHEYE_HIP_CLEARANCE_MM = 20;

/** Id of the waist notch where a bodice waist dart meets the skirt dart under it (decision 131, 3 pairing). */
export const WAIST_DART_NOTCH_ID = "waist-dart";

/**
 * The `edgeId` of a dart that lies inside the piece, not on an edge: the upper and lower halves of a fisheye dart
 * share their legs at the waist (decision 144, 4). No piece has an edge with this id.
 */
export const INTERIOR_DART_EDGE_ID = "interior";
