/** Parses what a person types into a measurement box: centimetres in, whole millimetres out. */
import { cmToMm, roundTo, toAsciiDigits } from "@tafsila/utils";

/** Keys of `measurements.errors.*` that parsing can report. */
export type CmParseError = "notANumber" | "tooManyDecimals";

/** Result of parsing one box. */
export type CmParseResult =
  | { readonly kind: "empty" }
  | { readonly kind: "value"; readonly mm: number }
  | { readonly kind: "error"; readonly error: CmParseError };

/** A number such as `92`, `92.5` or `92,5` (digits already ASCII). */
const CM_PATTERN = /^(\d+)(?:[.,](\d*))?$/;

/** Most digits after the decimal point (a tenth of a centimetre is one millimetre). */
const MAX_DECIMALS = 1;

/**
 * Parses typed centimetres. Western and Arabic-Indic digits, "." "," and "٫" are accepted; at most one decimal.
 *
 * @param text - What the person typed.
 * @returns Empty, a value in whole millimetres, or the reason it was refused.
 * @example
 * parseCm("٩٢٫٥") // { kind: "value", mm: 925 }
 */
export function parseCm(text: string): CmParseResult {
  const cleaned = toAsciiDigits(text).replaceAll("٫", ".").replaceAll("،", ",").trim();
  if (cleaned === "") return { kind: "empty" };
  const match = CM_PATTERN.exec(cleaned);
  if (!match) return { kind: "error", error: "notANumber" };
  if ((match[2] ?? "").length > MAX_DECIMALS) return { kind: "error", error: "tooManyDecimals" };
  return {
    kind: "value",
    mm: Math.round(roundTo(cmToMm(Number(`${match[1] ?? "0"}.${match[2] || "0"}`)), 1)),
  };
}
