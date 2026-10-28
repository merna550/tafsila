/** Number formatting of the fabric calculator: Western digits and one decimal for metres (FR-FAB-05, NFR-06). */

/** Millimetres in a centimetre. */
const MM_PER_CM = 10;

/** Tenths in a unit: width is rounded to one decimal. */
const TENTHS = 10;

/**
 * Formats metres with one decimal.
 *
 * @param metres - A length in metres.
 * @returns For example `1.3` or `12.0`.
 */
export function formatMetres(metres: number): string {
  return metres.toFixed(1);
}

/**
 * Formats a width in millimetres as whole or half centimetres.
 *
 * @param mm - A length in mm.
 * @returns Centimetres without trailing zeros, for example `140` or `74.5`.
 */
export function formatCm(mm: number): string {
  return String(Math.round((mm / MM_PER_CM) * TENTHS) / TENTHS);
}

/**
 * Tells whether a saved calculation was made by a different version of the nesting algorithm.
 *
 * @param stored - The version stored with the calculation.
 * @param current - The version this build runs.
 * @returns True when they differ.
 */
export function isOlderNestingVersion(stored: string, current: string): boolean {
  return stored !== current;
}
