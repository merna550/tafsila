/** The per-viewer setting of the direct-cut screen: the gap between curve points (FR-CUT-02). */

/** Storage key of the setting. */
export const CUT_SETTINGS_KEY = "tafsila.cut.settings";

/** The gaps the select offers, mm. */
// eslint-disable-next-line no-magic-numbers -- the three values FR-CUT-02 allows
export const CURVE_STEPS_MM = [20, 25, 30] as const;

/** A gap the select offers. */
export type CurveStepMm = (typeof CURVE_STEPS_MM)[number];

/** The gap used until the viewer picks one. */
export const DEFAULT_CURVE_STEP_MM: CurveStepMm = 25;

/**
 * Reads a stored setting; anything invalid gives the default.
 *
 * @param raw - The parsed storage value.
 * @returns The curve step to use.
 */
export function parseCurveStep(raw: unknown): CurveStepMm {
  const value =
    typeof raw === "object" && raw !== null ? (raw as { curveStepMm?: unknown }).curveStepMm : undefined;
  return CURVE_STEPS_MM.find((step) => step === value) ?? DEFAULT_CURVE_STEP_MM;
}
