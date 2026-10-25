/** Pure maths of the projector calibration: the factors, the size of the drawn square and the reading of typed sizes (issue #285). */
import { toAsciiDigits } from "@tafsila/utils";
import type { ProjectorCalibration, ScreenInfo } from "../projector.schema";

/** Shortest and longest measured side that is believed (5 cm to 5 m). */
export const MIN_MEASURED_MM = 50;
export const MAX_MEASURED_MM = 5000;

/** Smallest drawn square in CSS px, so a tiny screen still gets a measurable square. */
const MIN_SQUARE_PX = 100;
/** Share of the shorter screen side that the square fills. */
const SQUARE_SHARE = 0.6;
/** The square snaps to this many px, so the number stays the same across small resizes. */
const SQUARE_STEP_PX = 10;

/** A typed size: a number in mm, or why it was refused. */
export type MeasuredMm =
  { readonly ok: true; readonly mm: number } | { readonly ok: false; readonly reason: "invalid" | "range" };

/** Result of a calibration: the calibration, or the field and reason of the first refused size. */
export type CalibrationResult =
  | { readonly ok: true; readonly calibration: ProjectorCalibration }
  | {
      readonly ok: false;
      readonly field: "width" | "height";
      readonly reason: "invalid" | "range";
    };

/**
 * Side of the calibration square in CSS px. It is drawn in px, not CSS mm: a projector shows about one
 * CSS px per real mm or less, so a square in CSS mm would not fit its picture.
 *
 * @param screen - The screen the page is shown on.
 * @returns The side in CSS px, a multiple of 10, at least 100.
 */
export function nominalSquarePx(screen: ScreenInfo): number {
  const side = Math.min(screen.widthPx, screen.heightPx) * SQUARE_SHARE;
  return Math.max(MIN_SQUARE_PX, Math.floor(side / SQUARE_STEP_PX) * SQUARE_STEP_PX);
}

/**
 * Reads a size typed in mm: Arabic or Latin digits, "." "," or the Arabic decimal mark, up to two decimals.
 *
 * @param text - What the user typed.
 * @returns The size, or `invalid` (not a number) or `range` (outside 50 mm to 5 m).
 */
export function parseMeasuredMm(text: string): MeasuredMm {
  const cleaned = toAsciiDigits(text).replaceAll("٫", ".").replaceAll(",", ".").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return { ok: false, reason: "invalid" };
  const mm = Number(cleaned);
  if (mm <= 0) return { ok: false, reason: "invalid" };
  return mm < MIN_MEASURED_MM || mm > MAX_MEASURED_MM ? { ok: false, reason: "range" } : { ok: true, mm };
}

/**
 * Computes the CSS px per real mm on each axis from the measured sides of the drawn square.
 *
 * @param nominalPx - Side of the drawn square in CSS px.
 * @param typed - The measured sides as typed, in mm.
 * @param typed.width - Measured width.
 * @param typed.height - Measured height.
 * @param screen - The screen the calibration is for.
 * @param now - Clock, for the date stored with the result.
 * @returns The calibration, or the first refused field.
 */
export function calibrationFrom(
  nominalPx: number,
  typed: { readonly width: string; readonly height: string },
  screen: ScreenInfo,
  now: Date = new Date(),
): CalibrationResult {
  const width = parseMeasuredMm(typed.width);
  if (!width.ok) return { ok: false, field: "width", reason: width.reason };
  const height = parseMeasuredMm(typed.height);
  if (!height.ok) return { ok: false, field: "height", reason: height.reason };
  return {
    ok: true,
    calibration: {
      version: 1,
      pxPerMmX: nominalPx / width.mm,
      pxPerMmY: nominalPx / height.mm,
      screen,
      calibratedAt: now.toISOString(),
    },
  };
}
