/** Centimetres in the length fields, millimetres in the design (issue #246). */
import { cmToMm, mmToCm, roundTo, toAsciiDigits } from "@tafsila/utils";

/** What typing into an override field means. */
export type OverrideInput =
  | { readonly kind: "clear" }
  | { readonly kind: "set"; readonly mm: number }
  | { readonly kind: "invalid" }
  | { readonly kind: "range" };

/** A number such as `60`, `60.5` or `60,5`. */
const CM_PATTERN = /^\d+(?:[.,]\d?)?$/;

/**
 * Turns millimetres into the text shown in a field.
 *
 * @param mm - Length in mm.
 * @returns Centimetres with at most one decimal, such as "60" or "60.5".
 */
export function mmToCmText(mm: number): string {
  return String(roundTo(mmToCm(mm), 1));
}

/**
 * Reads what was typed in a centimetre field and checks it against the limits.
 *
 * @param text - What the person typed (Western or Arabic-Indic digits).
 * @param limit - Shortest and longest value in mm.
 * @returns Clear for an empty box, the value in mm, `invalid` for text that is not a number, `range` when outside the limits.
 */
export function parseOverride(
  text: string,
  limit: { readonly minMm: number; readonly maxMm: number },
): OverrideInput {
  const cleaned = toAsciiDigits(text).replaceAll("٫", ".").replaceAll("،", ",").trim();
  if (cleaned === "") return { kind: "clear" };
  if (!CM_PATTERN.test(cleaned)) return { kind: "invalid" };
  const mm = Math.round(cmToMm(Number(cleaned.replace(",", "."))));
  return mm < limit.minMm || mm > limit.maxMm ? { kind: "range" } : { kind: "set", mm };
}
