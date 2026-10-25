/** Reads and writes the projector calibration of this device in `localStorage`; storage failures read as "not calibrated" (issue #285). */
import { readJson, writeJson } from "@/shared/storage/safe-storage";
import { projectorCalibrationSchema, type ProjectorCalibration, type ScreenInfo } from "../projector.schema";

/** The `localStorage` key of the calibration. */
export const CALIBRATION_KEY = "tafsila.projector.calibration";

/** Pixel ratios closer than this are the same (browsers round zoom steps). */
const DPR_TOLERANCE = 0.01;

/** What is known about this device: not read yet, nothing usable, made on another setup, or valid. */
export type CalibrationState =
  | { readonly status: "loading"; readonly calibration: null }
  | { readonly status: "missing"; readonly calibration: null }
  | { readonly status: "stale"; readonly calibration: ProjectorCalibration }
  | { readonly status: "ok"; readonly calibration: ProjectorCalibration };

/** The state before the first read, shown by the server render. */
export const LOADING_STATE: CalibrationState = { status: "loading", calibration: null };

/**
 * Tells whether a calibration was made on this screen size and pixel ratio.
 *
 * @param calibration - The stored calibration.
 * @param screen - The screen now.
 * @returns True when nothing changed.
 */
function sameSetup(calibration: ProjectorCalibration, screen: ScreenInfo): boolean {
  const old = calibration.screen;
  return (
    old.widthPx === screen.widthPx &&
    old.heightPx === screen.heightPx &&
    Math.abs(old.devicePixelRatio - screen.devicePixelRatio) <= DPR_TOLERANCE
  );
}

/**
 * Reads the stored calibration and judges it against the screen now.
 *
 * @param screen - The screen now.
 * @returns `missing` for nothing, bad data or a failing storage; `stale` after a screen or pixel-ratio change; else `ok`.
 */
export function readCalibration(screen: ScreenInfo): CalibrationState {
  const parsed = projectorCalibrationSchema.safeParse(readJson(CALIBRATION_KEY));
  if (!parsed.success) return { status: "missing", calibration: null };
  return { status: sameSetup(parsed.data, screen) ? "ok" : "stale", calibration: parsed.data };
}

/**
 * Stores a calibration for this device.
 *
 * @param calibration - What to keep.
 * @returns False when the browser refused to store it.
 */
export function writeCalibration(calibration: ProjectorCalibration): boolean {
  return writeJson(CALIBRATION_KEY, calibration);
}
