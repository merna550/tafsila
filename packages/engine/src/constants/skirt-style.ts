/**
 * Constants of the straight and A-line skirt styles and the skirt slit (issue #135, decision 135-straight-a-line-skirt).
 * Method: `docs/engine/drafting-method.md`, "Straight and A-line skirts, slits" (Aldrich, Metric Pattern Cutting for
 * Women's Wear, Chapter 2 "Skirt block" and Chapter 3 "A-line skirt", "Skirt vents and slits").
 */

/**
 * Smallest finished hem circumference, in mm, that lets a woman walk in a straight skirt whose hem is below the
 * knee: about two mid-calf step lengths of 650 mm. Narrower straight skirts below the knee need a slit or a vent
 * (Aldrich, Chapter 2: "a straight skirt below the knee needs a vent or a slit"). FR-VAL-08 warns below it.
 */
export const WALKING_HEM_MIN_MM = 1300;

/** Width of the slit extension (the self facing folded back along the seam line), in mm (Aldrich: 40 mm vents). */
export const SLIT_EXTENSION_MM = 40;

/**
 * The slit top must stay at least this far below the hip line, measured along the seam, in mm, so the opening never
 * shows the hip and the top stitching sits on the straight part of the seam.
 */
export const SLIT_HIP_CLEARANCE_MM = 10;

/** Id of the notch that marks the slit top on the seam (stitch the seam down to it). */
export const SLIT_TOP_NOTCH_ID = "slit-top";

/** `DraftContext.resolved` key of the longest slit the drafted seam can take, in mm (read by the slit rule). */
export const SLIT_MAX_LENGTH_KEY = "skirt.slit.maxLengthMm";

/**
 * `DraftContext.resolved` key prefix of the A-line hem gain of one piece, in mm: the chord the closed dart opens at
 * the hem (`skirt.front.aLineHemGainMm`, `skirt.back.aLineHemGainMm`).
 */
export const A_LINE_HEM_GAIN_KEY = {
  front: "skirt.front.aLineHemGainMm",
  back: "skirt.back.aLineHemGainMm",
} as const;

/** The skirt types the slit module drafts a slit for (kept here so the picker rules need no drafting code). */
export const SLIT_SKIRT_TYPES: ReadonlySet<string> = new Set(["straight", "a-line"]);
