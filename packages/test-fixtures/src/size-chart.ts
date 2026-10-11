/** Demo size chart S-XXL built from `sizeM` (not the real Egyptian chart, Merna supplies it in #32). */
import type { Measurements, SizeChart } from "@tafsila/schemas";
import { sizeM } from "./measurements";

/** Lengths that grow with the size step (circumferences), in mm per step. */
const CIRCUMFERENCE_STEP_MM = 40;

/** Neck grows by this share of a circumference step. */
const NECK_STEP_SHARE = 0.25;

/** Sizes above M in the demo chart, counted in steps from M. */
const STEPS_L = 1;
const STEPS_XL = 2;
const STEPS_XXL = 3;

/** Circumference measurements that change between sizes. */
const CIRCUMFERENCE_KEYS = ["bust", "highBust", "underBust", "waist", "hip"] as const;

/**
 * Builds one demo size from size M.
 *
 * @param steps - Sizes away from M (negative = smaller).
 * @returns Measurements with circumferences moved by `steps` and the neck by a quarter of that.
 */
function sizeFromM(steps: number): Measurements {
  const grown: Measurements = {
    ...sizeM,
    neck: sizeM.neck + steps * CIRCUMFERENCE_STEP_MM * NECK_STEP_SHARE,
  };
  for (const key of CIRCUMFERENCE_KEYS) {
    const base = sizeM[key];
    if (base !== undefined) grown[key] = base + steps * CIRCUMFERENCE_STEP_MM;
  }
  return grown;
}

/** Demo chart with sizes S, M, L, XL and XXL. */
export const demoSizeChart: SizeChart = {
  S: sizeFromM(-STEPS_L),
  M: sizeM,
  L: sizeFromM(STEPS_L),
  XL: sizeFromM(STEPS_XL),
  XXL: sizeFromM(STEPS_XXL),
};
