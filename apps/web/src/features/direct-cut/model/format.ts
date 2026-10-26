/** Text helpers of the direct-cut screen: which language of a text to show and which digits to show it in (NFR-06). */
import type { LocalizedText } from "@/shared/pattern-preview";

/** Which digits the screen shows: Western (0-9) or Arabic-Indic (٠-٩). */
export type DigitStyle = "western" | "arabic-indic";

/** The Arabic-Indic digits, indexed by the Western digit they replace. */
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

/** The Arabic decimal separator. */
const ARABIC_DECIMAL = "٫";

/**
 * Converts the digits and the decimal point of a text; Western returns it unchanged. Only the characters of numbers
 * change, so point labels like "A" stay as they are. There is no digits setting yet, so the screen passes `western`.
 *
 * @param text - Text with Western digits, such as "22.5 سم".
 * @param style - The digits to show.
 * @returns The text in that style.
 * @example
 * localizeDigits("22.5 سم", "arabic-indic") // "٢٢٫٥ سم"
 */
export function localizeDigits(text: string, style: DigitStyle): string {
  if (style === "western") return text;
  return text
    .replace(/(?<=\d)\.(?=\d)/g, ARABIC_DECIMAL)
    .replace(/\d/g, (digit) => ARABIC_INDIC.charAt(Number(digit)));
}

/**
 * Picks the language of a bilingual text and applies the digit style.
 *
 * @param text - The bilingual text.
 * @param locale - The page language.
 * @param style - The digits to show.
 * @returns The text to render.
 */
export function showText(text: LocalizedText, locale: "ar" | "en", style: DigitStyle = "western"): string {
  return localizeDigits(text[locale], style);
}

/** Millimetres in a centimetre. */
const MM_PER_CM = 10;

/**
 * A length for a diagram label: millimetres as centimetres with at most one decimal, plus the unit.
 *
 * @param mm - Length, mm.
 * @param locale - The page language (picks the unit word).
 * @param style - The digits to show.
 * @returns For example "12.5 cm" or "12.5 سم".
 * @example
 * formatCm(125, "en", "western") // "12.5 cm"
 */
export function formatCm(mm: number, locale: "ar" | "en", style: DigitStyle): string {
  const cm = Number((mm / MM_PER_CM).toFixed(1));
  return localizeDigits(`${cm} ${locale === "ar" ? "سم" : "cm"}`, style);
}
