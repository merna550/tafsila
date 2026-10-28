/** Picks the text of the interface language from an Arabic and English pair (NFR-06). */
import type { BilingualText } from "@tafsila/schemas";

/** The two interface languages. */
export type TextLocale = "ar" | "en";

/**
 * Returns the side of a bilingual pair that matches the language.
 *
 * @param text - The Arabic and English text.
 * @param locale - Interface language.
 * @returns The text in that language.
 */
export function pickLocalized(text: BilingualText, locale: TextLocale): string {
  return text[locale];
}

/**
 * Returns the name of a fabric in the interface language.
 *
 * @param fabric - Its Arabic and English names.
 * @param locale - Interface language.
 * @returns The name in that language.
 */
export function fabricName(fabric: { nameAr: string; nameEn: string }, locale: TextLocale): string {
  return locale === "ar" ? fabric.nameAr : fabric.nameEn;
}

/**
 * Returns the name in the other language, shown small under the main name.
 *
 * @param fabric - Its Arabic and English names.
 * @param locale - Interface language.
 * @returns The name in the language that is not shown as the main name.
 */
export function fabricAltName(fabric: { nameAr: string; nameEn: string }, locale: TextLocale): string {
  return locale === "ar" ? fabric.nameEn : fabric.nameAr;
}
