/** The few measurements shown on a set card, converted from millimetres to centimetres. */
import type { Measurements } from "@tafsila/schemas";

/** Measurements shown on the card, in this order (the design shows six). */
export const KEY_FIELDS = ["bust", "waist", "hip", "shoulderWidth", "backLength", "height"] as const;

/** One of the card's measurements. */
export type KeyField = (typeof KEY_FIELDS)[number];

/** One value of the card. */
export interface KeyValue {
  /** Which measurement it is (the label comes from `measurements.fields.*`). */
  readonly field: KeyField;
  /** Centimetres with at most one decimal, in Western digits ("92", "92.5"). */
  readonly cm: string;
}

/** Millimetres in a centimetre. */
const MM_PER_CM = 10;

/**
 * Converts millimetres to centimetres with at most one decimal and no trailing ".0".
 *
 * @param mm - Length in millimetres.
 * @returns The text, for example "92" or "92.5".
 */
export function mmToCm(mm: number): string {
  return String(Math.round(mm) / MM_PER_CM);
}

/**
 * Picks the key values of a set; a field that is missing is left out instead of showing "NaN".
 *
 * @param measurements - The set's measurements in millimetres.
 * @returns Up to six values in card order.
 */
export function toKeyValues(measurements: Partial<Measurements>): KeyValue[] {
  return KEY_FIELDS.flatMap((field) => {
    const mm = measurements[field];
    return typeof mm === "number" ? [{ field, cm: mmToCm(mm) }] : [];
  });
}
