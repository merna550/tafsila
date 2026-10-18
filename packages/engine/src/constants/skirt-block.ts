/**
 * Constants of the straight skirt block (issue #129). Source: `docs/engine/drafting-method.md`, "Straight skirt,
 * front and back" (Aldrich, Chapter 2, "Skirt block"); the same numbers are `DRAFT_CONSTANTS` of the #122 reference drafts.
 */

/** Hip ease per quarter, in mm, built into the block (40 mm in total; `BLOCK_BUILT_IN_EASE_MM.skirtHip` / 4). */
export const SKIRT_HIP_EASE_QUARTER_MM = 10;

/** Waist ease per quarter, in mm, built into the block (20 mm in total; `BLOCK_BUILT_IN_EASE_MM.skirtWaist` / 4). */
export const SKIRT_WAIST_EASE_QUARTER_MM = 5;

/** Share of the waist shaping (hip quarter minus waist quarter) each half's dart takes; the side seam takes the rest. */
export const SKIRT_DART_SHARE = { front: 0.5, back: 0.6 } as const;

/** Dart length in mm, from the waist down to the apex (front darts are short, back darts follow the seat). */
export const SKIRT_DART_LENGTH_MM = { front: 90, back: 140 } as const;

/** Where the grain line starts and ends, as a share of the distance from the hip line to the hem (kept clear of both). */
export const SKIRT_GRAIN_LINE_SHARE = { from: 0.1, to: 0.6 } as const;

/** Side seams are trued until front and back differ by at most this, in mm (well inside FR-VAL-01's 2 mm). */
export const SKIRT_TRUING_TOLERANCE_MM = 0.01;

/** Most truing steps; each closes at least a third of the gap for any body in range, so 20 reach 0.01 mm. */
export const SKIRT_TRUING_MAX_STEPS = 20;
