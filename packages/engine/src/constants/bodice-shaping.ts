/**
 * Bodice shaping constants (issue #138, decision 138): princess style lines and the dart-free bodice.
 * Lengths in mm; shares are unitless. Method: docs/engine/drafting-method.md, "Princess seams and dart-free bodice".
 */
import { CATMULL_ROM_HANDLE_RATIO } from "./geometry";

/**
 * The shoulder princess line leaves the shoulder this share of the front shoulder length from the neck point
 * (Aldrich 6th ed., ch. 3, "princess line": the middle of the shoulder).
 */
export const PRINCESS_SHOULDER_SHARE = 0.5;

/**
 * The armhole princess line leaves the armhole this share of the armhole length from the shoulder tip
 * (Aldrich 6th ed., ch. 3, "princess line to the armhole": about a third of the way down, above the balance notch).
 */
export const PRINCESS_ARMHOLE_SHARE = 0.35;

/**
 * Least armhole left below an armhole princess line, so the set-in sleeve's balance notches (front 75 mm, back
 * 90 + 6 mm from the underarm, decision 134) stay on the side panel with room for the notch itself.
 */
export const PRINCESS_ARMHOLE_MIN_LOWER_MM = 110;

/**
 * Handle length of the style-line cubics as a share of their chord (the Catmull-Rom third), on the centre panels.
 * The side panels start from this value and are trued to the centre panel's length (decision 138, 3).
 */
export const PRINCESS_HANDLE_SHARE = CATMULL_ROM_HANDLE_RATIO;

/** Smallest handle share tried while truing a side-panel style curve (0 is the straight chord). */
export const PRINCESS_HANDLE_MIN_SHARE = 0;

/** Largest handle share tried while truing a side-panel style curve; past it the curve starts to loop. */
export const PRINCESS_HANDLE_MAX_SHARE = 0.9;

/** Bisection steps when truing a style curve: 40 halvings of 0.9 are far below a micrometre of length. */
export const PRINCESS_TRUE_STEPS = 40;

/** Grain line of a side panel: it starts this far below the panel's highest point and ends this far above the waist. */
export const SIDE_PANEL_GRAIN_INSET_MM = 40;
