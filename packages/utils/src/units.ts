/** Unit helpers: the engine works in millimetres; the UI shows centimetres. */

/** Millimetres in one centimetre. */
export const MM_PER_CM = 10;

/** Base of the decimal system, used for rounding to N decimals. */
const DECIMAL_BASE = 10;

/**
 * Converts centimetres (what users type) to millimetres (what the engine uses).
 *
 * @param cm - Length in centimetres.
 * @returns Length in millimetres.
 * @example
 * cmToMm(92) // 920
 */
export function cmToMm(cm: number): number {
  return cm * MM_PER_CM;
}

/**
 * Converts millimetres to centimetres for display.
 *
 * @param mm - Length in millimetres.
 * @returns Length in centimetres.
 * @example
 * mmToCm(925) // 92.5
 */
export function mmToCm(mm: number): number {
  return mm / MM_PER_CM;
}

/**
 * Rounds a number to a fixed number of decimals without floating-point noise (e.g. 0.1 + 0.2).
 *
 * @param value - Number to round.
 * @param decimals - Digits after the decimal point (0 or more).
 * @returns The rounded number.
 * @example
 * roundTo(12.3456, 1) // 12.3
 */
export function roundTo(value: number, decimals: number): number {
  const factor = DECIMAL_BASE ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
