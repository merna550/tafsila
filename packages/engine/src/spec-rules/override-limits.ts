/** The limits of the optional length overrides the picker offers (issue #246). */
import { FRONT_NECK_DEPTH_MIN_MM } from "../constants/neckline";
import { MIN_SKIRT_LENGTH_MM } from "../constants/skirt-length";

/** A length override of the design, such as the front neck depth. */
export type OverridePath = "neckline.depthFrontMm" | "skirt.lengthMm" | "skirt.slit.lengthMm";

/** The shortest and longest value of one override, in mm. */
export interface OverrideLimit {
  /** Shortest value the engine accepts (its own clamp). */
  readonly minMm: number;
  /** Longest value the picker offers; the body-specific maximum is still checked when the pattern is drafted. */
  readonly maxMm: number;
}

/** Shortest slit the picker offers. */
const SLIT_MIN_MM = 50;

/**
 * Limits per override. Minimums are the engine's own constants. Maximums depend on the body (neck inside the
 * bodice, waist to floor, hip clearance), which the picker does not have, so they are the largest sensible value.
 */
export const OVERRIDE_LIMITS_MM: Readonly<Record<OverridePath, OverrideLimit>> = {
  "neckline.depthFrontMm": { minMm: FRONT_NECK_DEPTH_MIN_MM, maxMm: 140 },
  "skirt.lengthMm": { minMm: MIN_SKIRT_LENGTH_MM, maxMm: 1400 },
  "skirt.slit.lengthMm": { minMm: SLIT_MIN_MM, maxMm: 1000 },
};
