/** Constants of the finishing step (issue #130, decision 130). Seam allowance defaults live in `EngineOptions`. */

/** Allowed gap, in mm, between the measured and the intended seam allowance (issue #130 acceptance; NFR-01 is ± 1 mm). */
export const SEAM_ALLOWANCE_TOLERANCE_MM = 0.1;

/** Edge kind that marks a cut-on-the-fold edge: it never gets a seam allowance. */
export const FOLD_EDGE_KIND = "fold";

/** Edge kind of a hem: where it meets a seam, the cut line uses the mirrored hem corner. */
export const HEM_EDGE_KIND = "hem";
