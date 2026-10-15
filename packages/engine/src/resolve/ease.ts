/** Reads the ease tables (issue #126). */
import type { EaseProfile } from "@tafsila/schemas";
import {
  BLOCK_BUILT_IN_EASE_MM,
  BODICE_FIT_MODIFIER_MM,
  EASE_TOTAL_MM,
  type BodiceFit,
  type EaseLine,
} from "../constants/ease";

/** Lines that the `bodice.fit` modifier applies to. */
const FIT_MODIFIED_LINES: readonly EaseLine[] = ["bust", "waist", "hip"];

/**
 * Total ease for one body line: table value plus the fit modifier (bust, waist, hip only), floored at 0.
 *
 * @param profile - Ease profile.
 * @param fit - Bodice fit.
 * @param line - Body line.
 * @returns Total ease in mm, never negative.
 */
export function totalEaseMm(profile: EaseProfile, fit: BodiceFit, line: EaseLine): number {
  const modifier = FIT_MODIFIED_LINES.includes(line) ? BODICE_FIT_MODIFIER_MM[fit] : 0;
  return Math.max(0, EASE_TOTAL_MM[profile][line] + modifier);
}

/**
 * Style ease for one block line: the total minus the ease already inside the block. May be negative.
 *
 * @param total - Total ease in mm.
 * @param builtIn - Name of the block's built-in ease.
 * @returns Remainder in mm.
 */
export function styleEaseMm(total: number, builtIn: keyof typeof BLOCK_BUILT_IN_EASE_MM): number {
  return total - BLOCK_BUILT_IN_EASE_MM[builtIn];
}
